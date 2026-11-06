/* Badges for the Games tab. Pure rules: they read your entries, plan and savings goals and say
   which badges you have earned and how close you are. No DOM or Firebase code lives here.
   Earned badges are remembered on this device, so a badge stays yours even if you later edit the entries. */
window.BADGES = (function () {
  'use strict';

  const GROUPS = [
    { id: 'habit', label: 'Consistency & Habit', hint: 'Keep logging, day after day.' },
    { id: 'money', label: 'Budgeting & Savings', hint: 'Discipline with your money.' },
    { id: 'fun', label: 'Special & Fun', hint: 'Humor and milestones.' }
  ];

  /* Savings that count as a first big step, per currency (about ₱5,000 / $100). Others use 100. */
  const PIGGY = { PHP: 5000, JPY: 15000, KRW: 130000, INR: 8000, IDR: 1500000, VND: 2500000, THB: 3500, CNY: 700, HKD: 800, ZAR: 1800, MXN: 1700, BRL: 500, SEK: 1000, NOK: 1000, DKK: 700, PLN: 400, AED: 370, SAR: 375, MYR: 450 };
  const DRINKS = /coffee|caf[eé]|kape|drinks?\b|boba|milk ?tea|bubble tea|frapp|latte|starbucks|tea\b|juice/i;
  const FREEZE_MS = 24 * 60 * 60 * 1000;

  const LIST = [
    { id: 'first-step', group: 'habit', emoji: '🐣', name: 'First Step', how: 'Log your first expense or set up your budget.' },
    { id: 'streak-7', group: 'habit', emoji: '📅', name: '7-Day Streak', how: 'Log an entry every day for 7 days in a row.', goal: 7 },
    { id: 'streak-30', group: 'habit', emoji: '🔥', name: 'Month Master', how: 'Log an entry every day for 30 days in a row.', goal: 30 },
    { id: 'detective', group: 'habit', emoji: '🕵️', name: 'Receipt Detective', how: 'Log 50 expenses with both a category and a payment method.', goal: 50 },
    { id: 'under-control', group: 'money', emoji: '🛡️', name: 'Under Control', how: 'Finish a month with income and no Needs, Wants or category limit over budget.' },
    { id: 'piggy', group: 'money', emoji: '🐖', name: 'Piggy Banker', how: 'Save your first {piggy} across your savings goals.' },
    { id: 'freezer', group: 'money', emoji: '🧊', name: 'Impulse Freezer', how: 'Freeze a purchase for 24 hours, then put the money in savings instead.', claim: 'freeze' },
    { id: 'emergency', group: 'money', emoji: '🛑', name: 'Emergency Guard', how: 'Build an emergency fund goal worth one month of your Needs spending.' },
    { id: 'no-boba', group: 'fun', emoji: '☕', name: 'No-Boba Champion', how: 'Go a full week (Mon to Sun) with at least 3 entries and no coffee or drinks.' },
    { id: 'zero-waste', group: 'fun', emoji: '🧹', name: 'Zero Waste', how: 'Review your subscriptions and cancel one you don’t use.', claim: 'self' },
    { id: 'wizard', group: 'fun', emoji: '🧙', name: 'Budget Wizard', how: 'Create 3 or more savings goals (Travel, Tech, Emergency…).', goal: 3 },
    { id: 'night-owl', group: 'fun', emoji: '🦉', name: 'Night Owl Logger', how: 'Log an entry between 12:00 AM and 4:59 AM.' }
  ];

  function pad(n) { return String(n).padStart(2, '0'); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromKey(key) { const p = key.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(key, n) { const d = fromKey(key); d.setDate(d.getDate() + n); return dayKey(d); }

  /** Longest run of calendar days that each have at least one entry, and the run that is still going. */
  function streaks(txs, todayKey) {
    const days = {};
    txs.forEach(function (t) { if (t && typeof t.date === 'string') days[t.date] = true; });
    const keys = Object.keys(days).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach(function (k) {
      run = prev && addDays(prev, 1) === k ? run + 1 : 1;
      if (run > best) best = run;
      prev = k;
    });
    /* The current streak counts if you logged today or yesterday (today isn't over yet). */
    let current = 0;
    let k = days[todayKey] ? todayKey : addDays(todayKey, -1);
    while (days[k]) { current++; k = addDays(k, -1); }
    return { best: best, current: current };
  }

  function isExpense(t) { return t.type === 'needs' || t.type === 'wants'; }

  /** A finished month with income where Needs, Wants and every category limit stayed within budget. */
  function underControl(txs, plan, todayKey) {
    const thisMonth = todayKey.slice(0, 7);
    const months = {};
    txs.forEach(function (t) { const m = (t.date || '').slice(0, 7); if (m && m < thisMonth) (months[m] = months[m] || []).push(t); });
    const shares = (plan && plan.shares) || { needs: 50, wants: 30, savings: 20 };
    const caps = ((plan && plan.cats) || []).filter(function (c) { return c.cents > 0 && c.type !== 'income'; });
    return Object.keys(months).sort().some(function (m) {
      const list = months[m];
      const sum = { income: 0, needs: 0, wants: 0, savings: 0 };
      list.forEach(function (t) { if (sum[t.type] !== undefined) sum[t.type] += t.cents || 0; });
      if (sum.income <= 0) return false;
      if (sum.needs > Math.round(sum.income * shares.needs / 100)) return false;
      if (sum.wants > Math.round(sum.income * shares.wants / 100)) return false;
      return caps.every(function (c) {
        const spent = list.filter(function (t) { return (t.category || '').toLowerCase() === c.name.toLowerCase(); })
          .reduce(function (a, t) { return a + (t.cents || 0); }, 0);
        return spent <= c.cents;
      });
    });
  }

  /** Average Needs per finished month with spending; this month's Needs when there are none yet. */
  function avgNeeds(txs, todayKey) {
    const thisMonth = todayKey.slice(0, 7);
    const by = {};
    let current = 0;
    txs.forEach(function (t) {
      if (t.type !== 'needs') return;
      const m = (t.date || '').slice(0, 7);
      if (m === thisMonth) current += t.cents || 0;
      else if (m && m < thisMonth) by[m] = (by[m] || 0) + (t.cents || 0);
    });
    const done = Object.keys(by);
    return done.length ? Math.round(done.reduce(function (a, m) { return a + by[m]; }, 0) / done.length) : current;
  }

  /** True when a finished Monday-to-Sunday week has at least 3 entries and none for coffee or drinks. */
  function noBoba(txs, todayKey) {
    const weeks = {};
    txs.forEach(function (t) {
      if (!t.date) return;
      const d = fromKey(t.date);
      const monday = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
      const w = weeks[monday] = weeks[monday] || { count: 0, drinks: false };
      w.count++;
      if (isExpense(t) && (DRINKS.test(t.category || '') || DRINKS.test(t.desc || ''))) w.drinks = true;
    });
    return Object.keys(weeks).some(function (monday) {
      const w = weeks[monday];
      return addDays(monday, 6) < todayKey && w.count >= 3 && !w.drinks;
    });
  }

  function nightOwl(txs) {
    return txs.some(function (t) { return typeof t.createdAt === 'number' && new Date(t.createdAt).getHours() < 5; });
  }

  function money(units, currency) {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(units); }
    catch (e) { return units + ' ' + currency; }
  }

  /**
   * Works out every badge from the data. input: { txs, plan, goals (null while loading), currency, today, store }.
   * Returns [{ ...badge, how, earned, progress: { have, goal } | null, waiting }].
   */
  function evaluate(input) {
    const txs = (input.txs || []).filter(function (t) { return t && typeof t.cents === 'number'; });
    const plan = input.plan || {};
    const goals = input.goals;
    const currency = input.currency || 'PHP';
    const today = input.today || dayKey(new Date());
    const store = input.store || { earned: {}, claims: {} };
    const piggyUnits = PIGGY[currency] || 100;
    const s = streaks(txs, today);
    const detailed = txs.filter(function (t) { return isExpense(t) && t.category && t.method; }).length;
    const saved = goals ? goals.reduce(function (a, g) { return a + (g.savedCents || 0); }, 0) : 0;
    const efund = goals ? goals.filter(function (g) { return g.kind === 'emergency'; }).reduce(function (a, g) { return a + (g.savedCents || 0); }, 0) : 0;
    const needs = avgNeeds(txs, today);

    const check = {
      'first-step': function () { return { ok: txs.length > 0 || (plan.cats && plan.cats.length > 0) || plan.salaryCents > 0 }; },
      'streak-7': function () { return { ok: s.best >= 7, have: Math.max(s.current, Math.min(s.best, 7)) }; },
      'streak-30': function () { return { ok: s.best >= 30, have: Math.max(s.current, Math.min(s.best, 30)) }; },
      detective: function () { return { ok: detailed >= 50, have: detailed }; },
      'under-control': function () { return { ok: underControl(txs, plan, today) }; },
      piggy: function () { return goals ? { ok: saved >= piggyUnits * 100, have: Math.floor(saved / 100), goal: piggyUnits, money: true } : { waiting: true }; },
      freezer: function () { return { ok: !!store.claims.freezer }; },
      emergency: function () {
        if (!goals) return { waiting: true };
        if (needs <= 0) return { ok: false };
        return { ok: efund >= needs, have: Math.floor(efund / 100), goal: Math.ceil(needs / 100), money: true };
      },
      'no-boba': function () { return { ok: noBoba(txs, today) }; },
      'zero-waste': function () { return { ok: !!store.claims['zero-waste'] }; },
      wizard: function () { return goals ? { ok: goals.length >= 3, have: goals.length } : { waiting: true }; },
      'night-owl': function () { return { ok: nightOwl(txs) }; }
    };

    return LIST.map(function (b) {
      const r = check[b.id]();
      const earnedAt = store.earned[b.id] || null;
      const goal = r.goal || b.goal || null;
      return Object.assign({}, b, {
        how: b.how.replace('{piggy}', money(piggyUnits, currency)),
        earned: !!earnedAt || !!r.ok,
        earnedAt: earnedAt,
        newlyMet: !!r.ok && !earnedAt,
        waiting: !!r.waiting && !earnedAt,
        progress: goal && !earnedAt && !r.ok ? { have: Math.min(r.have || 0, goal), goal: goal, money: !!r.money } : null
      });
    });
  }

  /* ---- Remembering earned badges on this device ---- */
  function key(uid) { return 'pbh.badges.' + uid; }
  function load(uid) {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(key(uid)) || 'null'); } catch (e) { /* storage off */ }
    const out = { earned: {}, claims: {}, freeze: null, fresh: !raw };
    if (raw && typeof raw === 'object') {
      if (raw.earned && typeof raw.earned === 'object') out.earned = raw.earned;
      if (raw.claims && typeof raw.claims === 'object') out.claims = raw.claims;
      if (raw.freeze && typeof raw.freeze.start === 'number') out.freeze = { start: raw.freeze.start, item: String(raw.freeze.item || '').slice(0, 60) };
    }
    return out;
  }
  function save(uid, store) {
    try { localStorage.setItem(key(uid), JSON.stringify({ earned: store.earned, claims: store.claims, freeze: store.freeze })); } catch (e) { /* storage off */ }
  }
  /** Records newly met badges and returns them, so the app can celebrate each one once. */
  function commit(uid, store, results) {
    const fresh = results.filter(function (b) { return b.newlyMet; });
    const now = Date.now();
    fresh.forEach(function (b) { store.earned[b.id] = now; });
    if (fresh.length || store.fresh) { store.fresh = false; save(uid, store); }
    return fresh;
  }

  return {
    GROUPS: GROUPS, LIST: LIST, FREEZE_MS: FREEZE_MS,
    evaluate: evaluate, load: load, save: save, commit: commit,
    _test: { streaks: streaks, underControl: underControl, noBoba: noBoba, avgNeeds: avgNeeds, dayKey: dayKey }
  };
})();
