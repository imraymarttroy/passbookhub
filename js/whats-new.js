/*
 * "What's in PassbookHub" tour, shown once per login.
 * Interactive slides with small live demos; close with X, Esc, a click outside, or finish the tour.
 * "Don't show this again" hides it per user until FEATURES_VERSION changes.
 * Open it any time with WHATS_NEW.show().
 */
window.WHATS_NEW = (function () {
  'use strict';

  /*
   * App version, shown in the top bar beside the AI button. MAJOR.MINOR.PATCH:
   *   MAJOR: a redesign or a big change in how the app works (2.0.0)
   *   MINOR: a new feature (2.1.0)
   *   PATCH: fixes and small polish (2.1.1)
   * Bump it with every release and update CHANGES below. A new version shows the tour once more,
   * even for people who ticked "Don't show this again".
   */
  const APP_VERSION = '2.1.0';
  /* The full tour on login only comes back when this changes; small updates use the minimal popup instead. */
  const FEATURES_VERSION = '2.0.0';

  /* What changed in APP_VERSION, shown in the minimal update popup (version button in the sidebar). */
  const UPDATE = {
    en: { title: 'What\u2019s new', close: 'Close', ok: 'Got it', items: [
      ['New Overview', 'Safe-to-spend, 50/30/20 progress, budget limits, bills and cashflow on one screen.'],
      ['Quick add', 'Add an expense or income right from the Overview.'],
      ['Ask PassbookHub AI', 'A cleaner side panel that slides in from the right.'],
      ['Coming soon', 'Community and Blog are in the sidebar, locked for now.']
    ] },
    fil: { title: 'Ano ang bago', close: 'Isara', ok: 'Sige', items: [
      ['Bagong Overview', 'Safe-to-spend, 50/30/20 progress, budget limits, bayarin at cashflow sa iisang screen.'],
      ['Quick add', 'Mag-add ng gastos o kita mula mismo sa Overview.'],
      ['Ask PassbookHub AI', 'Mas malinis na side panel na lumalabas mula sa kanan.'],
      ['Malapit na', 'Nasa sidebar na ang Community at Blog, naka-lock muna.']
    ] }
  };

  const TEXT = {
    en: {
      eyebrow: "What's in PassbookHub", close: 'Close tour', back: 'Back', next: 'Next', done: "Let's go",
      skip: 'Skip', hide: "Don't show this again", of: 'of', goTo: 'Go to slide', tryIt: 'Try it',
      soonTitle: 'And there is more coming', soonBody: 'Here is what we are building next for you and your circle.',
      soon: ['Savings tracker', 'Wallet', 'Savings', 'Credit', 'Loan', '50/30/20 budget', 'Bill reminders', 'Expense splitter'],
      soonTag: 'Soon',
      updateTitle: 'New in version', updateBody: 'A cleaner PassbookHub. Here is what changed in this update.',
      changes: ['Flat, minimal design in light and dark mode', 'Feed redesigned: like, reply, repost and quote', 'For you and Following tabs in the Feed', 'Your circle now lives on your profile', 'Dashboard starts with the Overview'],
      budgetTitle: 'Your money, split smart', budgetBody: 'Drag to set your monthly income. PassbookHub splits it 50/30/20 for you.',
      income: 'Monthly income', needs: 'Needs', wants: 'Wants', savings: 'Savings',
      trackTitle: 'Every peso, tracked', trackBody: 'Log a spend and watch your category limit. We warn you before you go over.',
      groceries: 'Groceries', addSpend: '+ ₱500 expense', reset: 'Start over', left: 'left', almost: 'Almost at limit', over: 'Over by', limit: 'Limit',
      goalTitle: 'Goals you can feel', goalBody: 'Set a target and watch it fill. Tap to save and reach your emergency fund.',
      goalName: 'Emergency fund', save: '+ ₱3,000 saved', goalMet: 'Goal met!', of2: 'of',
      dueTomorrow: 'Due tomorrow', paid: 'Paid', rent: 'Rent split with Ate', kuya: 'Kuya owes you',
      aiTitle: 'Your circle and an AI coach', aiBody: 'Share wins with family and friends, and ask PassbookHub AI anything about money.',
      q: 'How do I start an emergency fund?', a: 'Start small: save 3 to 6 months of needs. Even ₱500 a payday adds up. Want me to set a goal?', replay: 'Replay',
      secTitle: 'Safe, and always yours', secBody: 'Two-step verification protects your account. Your monthly statement saves as a PDF.',
      verified: 'Verified', statement: 'November statement'
    },
    fil: {
      eyebrow: 'Mga feature ng PassbookHub', close: 'Isara ang tour', back: 'Bumalik', next: 'Susunod', done: 'Tara na',
      skip: 'Laktawan', hide: 'Huwag nang ipakita ulit', of: 'sa', goTo: 'Pumunta sa slide', tryIt: 'Subukan',
      soonTitle: 'May paparating pa', soonBody: 'Ito ang susunod naming gagawin para sa iyo at sa circle mo.',
      soon: ['Savings tracker', 'Wallet', 'Ipon', 'Credit', 'Utang', '50/30/20 budget', 'Paalala sa bayarin', 'Hatian ng gastos'],
      soonTag: 'Malapit na',
      updateTitle: 'Bago sa version', updateBody: 'Mas malinis na PassbookHub. Ito ang mga nagbago sa update na ito.',
      changes: ['Flat at minimal na design, light at dark mode', 'Bagong Feed: like, reply, repost at quote', 'May For you at Following sa Feed', 'Nasa profile mo na ang circle mo', 'Overview muna ang Dashboard'],
      budgetTitle: 'Matalinong hatian ng pera', budgetBody: 'I-drag para itakda ang buwanang kita. Hahatiin ito ng PassbookHub sa 50/30/20.',
      income: 'Buwanang kita', needs: 'Needs', wants: 'Wants', savings: 'Ipon',
      trackTitle: 'Bawat piso, bantay', trackBody: 'Magtala ng gastos at bantayan ang limit. Babalaan ka namin bago ka lumampas.',
      groceries: 'Grocery', addSpend: '+ ₱500 na gastos', reset: 'Ulitin', left: 'natitira', almost: 'Malapit na sa limit', over: 'Lumampas ng', limit: 'Limit',
      goalTitle: 'Mga goal na ramdam mo', goalBody: 'Magtakda ng target at panoorin itong mapuno. I-tap para mag-ipon.',
      goalName: 'Emergency fund', save: '+ ₱3,000 na ipon', goalMet: 'Naabot mo na!', of2: 'sa',
      dueTomorrow: 'Due bukas', paid: 'Bayad na', rent: 'Hati sa upa kay Ate', kuya: 'Utang ni Kuya sa iyo',
      aiTitle: 'Ang circle mo at isang AI coach', aiBody: 'Ibahagi ang tagumpay sa pamilya at kaibigan, at magtanong sa PassbookHub AI tungkol sa pera.',
      q: 'Paano magsimula ng emergency fund?', a: 'Magsimula nang maliit: mag-ipon ng 3 hanggang 6 na buwan ng needs. Kahit ₱500 kada sweldo, malaki na. Gusto mong gumawa tayo ng goal?', replay: 'Ulitin',
      secTitle: 'Ligtas, at sa iyo lang', secBody: 'Pinoprotektahan ng two-step verification ang account mo. Puwedeng i-save bilang PDF ang buwanang statement.',
      verified: 'Verified', statement: 'Statement ng Nobyembre'
    }
  };

  /* ---------- helpers ---------- */

  function lang() {
    const l = (document.documentElement.lang || '').toLowerCase();
    return l.indexOf('fil') === 0 || l.indexOf('tl') === 0 ? 'fil' : 'en';
  }
  function get(store, key) { try { return window[store].getItem(key); } catch (e) { return null; } }
  function set(store, key, val) { try { window[store].setItem(key, val); } catch (e) { /* storage may be off */ } }
  function peso(n) { return '₱' + Math.round(n).toLocaleString('en-PH'); }
  const reduced = function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  function el(tag, attrs) {
    const n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v; // only ever used with the static SVG icons below
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    for (let i = 2; i < arguments.length; i++) add(n, arguments[i]);
    return n;
  }
  function add(n, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(n, x); });
    else n.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }

  const ICONS = {
    budget: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/></svg>',
    track: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16"/><path d="m7 14 4-4 3 3 5-6"/></svg>',
    goal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 11h.01M12 11h.01M15 11h.01"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>'
  };
  function icon(name, cls) { return el('span', { class: 'wn-svg ' + (cls || ''), 'aria-hidden': 'true', html: ICONS[name] }); }

  /* ---------- demos (each returns { node, stop }) ---------- */

  function demoBudget(t) {
    const out = el('output', { class: 'wn-big' });
    const rows = [['needs', 0.5, 'wn-c1'], ['wants', 0.3, 'wn-c2'], ['savings', 0.2, 'wn-c3']].map(function (r) {
      const amt = el('b');
      const fill = el('i', { class: 'wn-fill ' + r[2] });
      return { r: r, amt: amt, fill: fill, node: el('div', { class: 'wn-split' },
        el('div', { class: 'wn-split-top' }, el('span', {}, t[r[0]] + ' · ' + Math.round(r[1] * 100) + '%'), amt),
        el('div', { class: 'wn-meter' }, fill)) };
    });
    const range = el('input', { type: 'range', min: '5000', max: '150000', step: '1000', value: '25000', 'aria-label': t.income, class: 'wn-range' });
    function paint() {
      const v = Number(range.value);
      out.textContent = peso(v);
      range.style.setProperty('--pct', ((v - 5000) / 1450) + '%');
      rows.forEach(function (x) { x.amt.textContent = peso(v * x.r[1]); x.fill.style.width = (x.r[1] * 100 / 0.5) + '%'; });
    }
    range.addEventListener('input', paint);
    paint();
    return { node: el('div', { class: 'wn-demo' },
      el('div', { class: 'wn-income' }, el('span', { class: 'wn-label' }, t.income), out), range,
      el('div', { class: 'wn-splits' }, rows.map(function (x) { return x.node; }))) };
  }

  function demoTrack(t) {
    const LIMIT = 5000;
    let spent = 3000;
    const fill = el('i', { class: 'wn-fill' });
    const status = el('span', { class: 'wn-status', 'aria-live': 'polite' });
    const spentOut = el('b');
    const btn = el('button', { type: 'button', class: 'wn-chip-btn', onclick: function () {
      if (spent > LIMIT) { spent = 3000; } else { spent += 500; }
      paint(true);
    } });
    function paint(bump) {
      const pct = spent / LIMIT;
      fill.style.width = Math.min(100, pct * 100) + '%';
      const state = pct > 1 ? 'over' : pct >= 0.8 ? 'near' : 'ok';
      fill.dataset.state = state; status.dataset.state = state;
      status.textContent = state === 'over' ? t.over + ' ' + peso(spent - LIMIT)
        : state === 'near' ? t.almost + ', ' + peso(LIMIT - spent) + ' ' + t.left
        : peso(LIMIT - spent) + ' ' + t.left;
      spentOut.textContent = peso(spent);
      btn.textContent = state === 'over' ? t.reset : t.addSpend;
      if (bump && !reduced()) { spentOut.classList.remove('wn-pop'); void spentOut.offsetWidth; spentOut.classList.add('wn-pop'); }
    }
    paint(false);
    return { node: el('div', { class: 'wn-demo' },
      el('div', { class: 'wn-cat' },
        el('span', { class: 'wn-cat-ico', 'aria-hidden': 'true' }, '🛒'),
        el('div', { class: 'wn-grow' },
          el('div', { class: 'wn-split-top' }, el('strong', {}, t.groceries), spentOut),
          el('div', { class: 'wn-meter wn-meter-lg' }, fill),
          el('div', { class: 'wn-split-top wn-small' }, status, el('span', {}, t.limit + ' ' + peso(LIMIT))))),
      btn) };
  }

  function demoGoal(t) {
    const TARGET = 30000;
    let saved = 12000;
    const R = 42, C = 2 * Math.PI * R;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'wn-ring'); svg.setAttribute('aria-hidden', 'true');
    const track = document.createElementNS(NS, 'circle');
    const bar = document.createElementNS(NS, 'circle');
    [track, bar].forEach(function (c) { c.setAttribute('cx', '50'); c.setAttribute('cy', '50'); c.setAttribute('r', String(R)); });
    track.setAttribute('class', 'wn-ring-track'); bar.setAttribute('class', 'wn-ring-bar');
    bar.setAttribute('stroke-dasharray', String(C)); bar.setAttribute('stroke-dashoffset', String(C));
    svg.append(track, bar);
    const pctOut = el('b', { class: 'wn-ring-pct' });
    const sub = el('span', { class: 'wn-ring-sub' });
    const burst = el('div', { class: 'wn-burst', 'aria-hidden': 'true' });
    const btn = el('button', { type: 'button', class: 'wn-chip-btn', onclick: function () {
      saved = saved >= TARGET ? 12000 : Math.min(TARGET, saved + 3000);
      paint();
      if (saved >= TARGET) celebrate();
    } });
    function celebrate() {
      if (reduced()) return;
      burst.replaceChildren();
      for (let i = 0; i < 14; i++) {
        const s = el('i');
        s.style.setProperty('--a', (i * 360 / 14) + 'deg');
        s.style.setProperty('--h', String((i * 47) % 360));
        burst.appendChild(s);
      }
      burst.classList.remove('wn-go'); void burst.offsetWidth; burst.classList.add('wn-go');
    }
    function paint() {
      const p = saved / TARGET;
      bar.setAttribute('stroke-dashoffset', String(C * (1 - p)));
      bar.classList.toggle('wn-done', p >= 1);
      pctOut.textContent = p >= 1 ? t.goalMet : Math.round(p * 100) + '%';
      sub.textContent = peso(saved) + ' ' + t.of2 + ' ' + peso(TARGET);
      btn.textContent = p >= 1 ? t.reset : t.save;
    }
    const timer = setTimeout(paint, 60); // let the ring animate in from empty
    pctOut.textContent = '0%'; sub.textContent = peso(0) + ' ' + t.of2 + ' ' + peso(TARGET); btn.textContent = t.save;
    return {
      stop: function () { clearTimeout(timer); },
      node: el('div', { class: 'wn-demo wn-goal' },
        el('div', { class: 'wn-ring-wrap' }, svg, el('div', { class: 'wn-ring-mid' }, pctOut), burst),
        el('div', { class: 'wn-goal-side' },
          el('strong', {}, t.goalName), sub, btn,
          el('div', { class: 'wn-debts' },
            el('div', { class: 'wn-debt' }, el('span', {}, t.rent), el('em', { class: 'wn-tag wn-warn' }, t.dueTomorrow)),
            el('div', { class: 'wn-debt' }, el('span', {}, t.kuya), el('em', { class: 'wn-tag wn-good' }, t.paid)))))
    };
  }

  function demoAI(t) {
    const log = el('div', { class: 'wn-chat', 'aria-live': 'polite' });
    let timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, reduced() ? 0 : ms)); }
    function play() {
      timers.forEach(clearTimeout); timers = [];
      log.replaceChildren();
      later(function () { log.appendChild(el('div', { class: 'wn-bubble wn-me' }, t.q)); }, 250);
      later(function () {
        log.appendChild(el('div', { class: 'wn-bubble wn-bot wn-typing', 'aria-label': '…' }, el('i'), el('i'), el('i')));
      }, 900);
      later(function () {
        const typing = log.querySelector('.wn-typing');
        if (typing) typing.remove();
        log.appendChild(el('div', { class: 'wn-bubble wn-bot' }, el('span', { class: 'wn-bot-name' }, 'PassbookHub AI'), t.a));
      }, 2300);
    }
    play();
    return {
      stop: function () { timers.forEach(clearTimeout); },
      node: el('div', { class: 'wn-demo' },
        el('div', { class: 'wn-faces', 'aria-hidden': 'true' },
          ['M', 'A', 'J', 'K'].map(function (c, i) { return el('span', { class: 'wn-face', style: '--i:' + i }, c); }),
          el('span', { class: 'wn-online' }, '● 4 online')),
        log,
        el('button', { type: 'button', class: 'wn-chip-btn wn-ghost', onclick: play }, t.replay))
    };
  }

  function demoSecurity(t) {
    const digits = '482913'.split('');
    const boxes = digits.map(function () { return el('span', { class: 'wn-otp-box' }); });
    const ok = el('div', { class: 'wn-verified' }, icon('check'), el('span', {}, t.verified));
    let timers = [];
    digits.forEach(function (d, i) {
      timers.push(setTimeout(function () { boxes[i].textContent = d; boxes[i].classList.add('wn-in'); }, reduced() ? 0 : 300 + i * 220));
    });
    timers.push(setTimeout(function () { ok.classList.add('wn-in'); boxes.forEach(function (b) { b.classList.add('wn-ok'); }); }, reduced() ? 0 : 300 + digits.length * 220 + 200));
    return {
      stop: function () { timers.forEach(clearTimeout); },
      node: el('div', { class: 'wn-demo' },
        el('div', { class: 'wn-otp' }, boxes), ok,
        el('div', { class: 'wn-paper' }, icon('pdf'),
          el('div', { class: 'wn-grow' }, el('strong', {}, t.statement), el('span', { class: 'wn-lines' }, el('i'), el('i'), el('i'))),
          el('em', { class: 'wn-tag' }, 'PDF')))
    };
  }

  function demoSoon(t) {
    return { node: el('div', { class: 'wn-demo wn-soon' },
      t.soon.map(function (s, i) { return el('span', { class: 'wn-soon-chip', style: '--i:' + i }, icon('spark'), s); })) };
  }

  function demoUpdate(t) {
    return { node: el('div', { class: 'wn-demo wn-update' },
      el('ul', { class: 'wn-changes' }, t.changes.map(function (c) { return el('li', {}, icon('check'), el('span', {}, c)); }))) };
  }

  const SLIDES = [
    { icon: 'spark', title: 'updateTitle', body: 'updateBody', demo: demoUpdate, version: true },
    { icon: 'budget', title: 'budgetTitle', body: 'budgetBody', demo: demoBudget, soon: true },
    { icon: 'track', title: 'trackTitle', body: 'trackBody', demo: demoTrack, soon: true },
    { icon: 'goal', title: 'goalTitle', body: 'goalBody', demo: demoGoal, soon: true },
    { icon: 'ai', title: 'aiTitle', body: 'aiBody', demo: demoAI, go: '#feed' },
    { icon: 'lock', title: 'secTitle', body: 'secBody', demo: demoSecurity, go: '#settings' },
    { icon: 'spark', title: 'soonTitle', body: 'soonBody', demo: demoSoon }
  ];

  /* ---------- the tour ---------- */

  function showFeaturesOnLogin(uid) {
    const id = uid || 'anon';
    if (get('localStorage', 'pbh-features-hidden:' + id) === FEATURES_VERSION) return;
    if (get('sessionStorage', 'pbh-features-seen:' + id)) return;
    set('sessionStorage', 'pbh-features-seen:' + id, '1');
    showFeatures(id);
  }

  function showFeatures(uid) {
    if (document.querySelector('.wn-overlay')) return;
    const t = TEXT[lang()];
    const opener = document.activeElement;
    let index = 0;
    let current = null;

    const hideBox = el('input', { type: 'checkbox' });
    const counter = el('span', { class: 'wn-count' });
    const stage = el('div', { class: 'wn-stage', 'aria-live': 'polite' });
    const segs = SLIDES.map(function (s, i) {
      return el('button', { type: 'button', class: 'wn-seg', 'aria-label': t.goTo + ' ' + (i + 1), onclick: function () { go(i); } }, el('i'));
    });
    const backBtn = el('button', { type: 'button', class: 'wn-nav wn-nav-back', onclick: function () { go(index - 1); } }, icon('left'), el('span', {}, t.back));
    const nextLabel = el('span');
    const nextBtn = el('button', { type: 'button', class: 'wn-nav wn-nav-next', onclick: function () { if (index === SLIDES.length - 1) close(); else go(index + 1); } }, nextLabel, icon('right'));

    function go(i) {
      if (i < 0 || i >= SLIDES.length) return;
      const dir = i >= index ? 'wn-from-right' : 'wn-from-left';
      index = i;
      if (current && current.stop) current.stop();
      const s = SLIDES[i];
      current = s.demo(t);
      const tryBtn = s.go ? el('a', { class: 'wn-try', href: s.go, onclick: function () { close(); } }, t.tryIt, icon('right')) : null;
      const slide = el('section', { class: 'wn-slide ' + dir, 'aria-roledescription': 'slide', 'aria-label': (i + 1) + ' ' + t.of + ' ' + SLIDES.length },
        el('div', { class: 'wn-head' },
          icon(s.icon, 'wn-badge'),
          el('div', {}, el('h2', { id: 'wn-title' }, el('span', { class: 'wn-grad' }, t[s.title] + (s.version ? ' ' + APP_VERSION : '')),
            s.soon ? el('span', { class: 'wn-soon-tag' }, t.soonTag) : null), el('p', { class: 'wn-body' }, t[s.body]))),
        current.node,
        tryBtn);
      stage.replaceChildren(slide);
      counter.textContent = (i + 1) + ' ' + t.of + ' ' + SLIDES.length;
      segs.forEach(function (b, j) {
        b.classList.toggle('wn-past', j < i);
        b.classList.toggle('wn-now', j === i);
        if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      backBtn.disabled = i === 0;
      nextLabel.textContent = i === SLIDES.length - 1 ? t.done : t.next;
      nextBtn.classList.toggle('wn-final', i === SLIDES.length - 1);
    }

    function close() {
      if (current && current.stop) current.stop();
      if (hideBox.checked) set('localStorage', 'pbh-features-hidden:' + (uid || 'anon'), FEATURES_VERSION);
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('wn-out');
      setTimeout(function () { overlay.remove(); }, reduced() ? 0 : 220);
      if (opener && opener.focus && document.contains(opener)) opener.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      const typing = e.target && (e.target.tagName === 'INPUT' && e.target.type === 'range');
      if (!typing && e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (!typing && e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      if (e.key === 'Tab') { // keep focus inside the tour
        const f = Array.prototype.filter.call(card.querySelectorAll('button:not([disabled]), input, a[href]'), function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    // Swipe left/right on touch screens (ignored while dragging the income slider).
    let sx = null, sy = 0;
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' && !(e.target.closest && e.target.closest('input'))) { sx = e.clientX; sy = e.clientY; } });
    stage.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
    });

    const xBtn = el('button', { type: 'button', class: 'wn-x', 'aria-label': t.close, onclick: close }, icon('x'));

    const card = el('div', { class: 'wn-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'wn-title' },
      el('div', { class: 'wn-blobs', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
      el('div', { class: 'wn-top' },
        el('span', { class: 'wn-eyebrow' }, el('span', { class: 'wn-dot' }), t.eyebrow),
        counter, xBtn),
      el('div', { class: 'wn-segs' }, segs),
      stage,
      el('div', { class: 'wn-foot' },
        el('label', { class: 'wn-hide' }, hideBox, el('span', {}, t.hide)),
        el('div', { class: 'wn-navs' }, backBtn, nextBtn)));

    const overlay = el('div', { class: 'wn-overlay', 'data-no-translate': '', onclick: function (e) { if (e.target === overlay) close(); } }, card);
    overlay.closeTour = function () {
      if (current && current.stop) current.stop();
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    };
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    markSeen(uid);
    document.querySelectorAll('.version-btn').forEach(function (b) { b.classList.remove('is-new'); });
    go(0);
    nextBtn.focus();
  }

  /** Minimal "what's new" popup for the current version. Opens over the page; close with X, Esc or a click outside. */
  function showUpdate(uid) {
    if (document.querySelector('.wu-overlay')) return;
    const t = UPDATE[lang()];
    const opener = document.activeElement;
    function close() {
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('wu-out');
      setTimeout(function () { overlay.remove(); }, reduced() ? 0 : 160);
      if (opener && opener.focus && document.contains(opener)) opener.focus();
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    const okBtn = el('button', { type: 'button', class: 'wu-ok', onclick: close }, t.ok);
    const card = el('div', { class: 'wu-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'wu-title' },
      el('div', { class: 'wu-head' },
        el('div', {}, el('p', { class: 'wu-label' }, 'v' + APP_VERSION), el('h2', { id: 'wu-title' }, t.title)),
        el('button', { type: 'button', class: 'wu-x', 'aria-label': t.close, onclick: close }, icon('x'))),
      el('ul', { class: 'wu-list' }, t.items.map(function (it) {
        return el('li', {}, el('p', { class: 'wu-item' }, it[0]), el('p', { class: 'wu-desc' }, it[1]));
      })),
      el('div', { class: 'wu-foot' }, okBtn));
    const overlay = el('div', { class: 'wu-overlay', 'data-no-translate': '', onclick: function (e) { if (e.target === overlay) close(); } }, card);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    markSeen(uid);
    document.querySelectorAll('.version-btn').forEach(function (b) { b.classList.remove('is-new'); });
    okBtn.focus();
  }

  function resetSession() {
    try {
      Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf('pbh-features-seen:') === 0) sessionStorage.removeItem(k); });
    } catch (e) { /* storage may be off */ }
  }

  /** Closes the tour right away (for example when you sign out). */
  function closeNow() {
    document.querySelectorAll('.wn-overlay').forEach(function (o) { if (o.closeTour) o.closeTour(); else o.remove(); });
    document.querySelectorAll('.wu-overlay').forEach(function (o) { o.remove(); });
  }

  /** True until this person opens the tour for the current version (lights the dot on the version button). */
  function isNew(uid) { return get('localStorage', 'pbh-version-seen:' + (uid || 'anon')) !== APP_VERSION; }
  function markSeen(uid) { set('localStorage', 'pbh-version-seen:' + (uid || 'anon'), APP_VERSION); }

  return { showOnLogin: showFeaturesOnLogin, show: showFeatures, showUpdate: showUpdate, close: closeNow, resetSession: resetSession, version: APP_VERSION, isNew: isNew, markSeen: markSeen };
})();
