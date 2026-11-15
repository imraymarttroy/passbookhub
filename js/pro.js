/*
 * Welcome pop-up (once after every sign-in, closes only with Continue) and the PassbookHub Pro sheet.
 * Pro's free trial is started through Google Pay (settings in config.js → googlePay).
 * Plain script: exposes window.PRO. No Firebase code here.
 */
window.PRO = (function () {
  'use strict';

  const ICONS = {
    dash: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="3.5" y="8" width="17" height="11" rx="2.5"/><path d="M16 13.5h.01"/>',
    history: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
    goal: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    ai: '<path d="M12 3.5 13.8 9 19.5 10.5 13.8 12 12 17.5 10.2 12 4.5 10.5 10.2 9z"/><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    people: '<circle cx="9" cy="8.5" r="3"/><circle cx="16.5" cy="9.5" r="2.3"/><path d="M3.5 19c.7-3 2.9-4.7 5.5-4.7s4.8 1.7 5.5 4.7M15 14.6c2.3-.2 4.4 1.1 5 3.9"/>',
    crown: '<path d="M3.5 8.5 7.5 11.5 12 5l4.5 6.5 4-3-2 10h-13z"/>',
    infinity: '<path d="M7 9c-2.2 0-3.5 1.4-3.5 3S4.8 15 7 15c3.5 0 6.5-6 10-6 2.2 0 3.5 1.4 3.5 3S19.2 15 17 15c-3.5 0-6.5-6-10-6z"/>',
    brush: '<path d="M14.5 4.5 19.5 9.5 11 18l-5-5z"/><path d="M6 13c-2 0-2.5 2-2.5 3.5S3 19.5 3 19.5s3.5.5 5-1 1-3 1-3"/>',
    noads: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>'
  };

  function el(tag, attrs) {
    const n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
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
  function svg(name) {
    const span = el('span', { class: 'pw-ico', 'aria-hidden': 'true' });
    /* Static icon markup from ICONS above, never user text. */
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
    return span;
  }
  function get(store, key) { try { return window[store].getItem(key); } catch (e) { return null; } }
  function set(store, key, val) { try { window[store].setItem(key, val); } catch (e) { /* storage off */ } }
  const reduced = function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  /** Keeps Tab inside the card while a pop-up is open. */
  function trapFocus(card, e) {
    if (e.key !== 'Tab') return;
    const f = Array.prototype.filter.call(card.querySelectorAll('button:not([disabled]), a[href]'), function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Welcome ---------- */

  const FEATURES = [
    ['dash', 'Dashboard', 'Accounts, spending, budget, goals and debts at a glance.'],
    ['wallet', 'Wallet / Accounts', 'Cash, bank and e-wallet balances in one place.'],
    ['history', 'History', 'Search and filter every transaction you log.'],
    ['goal', 'Budgets & goals', 'Category limits, a 50/30/20 split and savings goals.'],
    ['ai', 'Ask PassbookHub AI', 'Clear answers to your money questions, any time.'],
    ['people', 'Community & games', 'Share wins with your circle and earn badges.']
  ];

  function showWelcome(onDone) {
    if (document.querySelector('.pw-overlay.pw-welcome')) return;
    const btn = el('button', { type: 'button', class: 'pw-primary', onclick: close }, 'Continue');
    const card = el('div', { class: 'pw-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pw-title', 'aria-describedby': 'pw-sub' },
      el('div', { class: 'pw-head' },
        el('h2', { id: 'pw-title', class: 'pw-title' }, 'Welcome to PassbookHub'),
        el('p', { id: 'pw-sub', class: 'pw-sub' }, 'Your personal finance companion. Budget smarter, save with purpose and see every peso in one place.')),
      el('hr', { class: 'pw-rule' }),
      el('ul', { class: 'pw-list' }, FEATURES.map(function (f) {
        return el('li', null, svg(f[0]), el('div', null, el('p', { class: 'pw-item' }, f[1]), el('p', { class: 'pw-desc' }, f[2])));
      })),
      el('div', { class: 'pw-foot' }, btn));
    /* No close button, no Esc, no click outside: Continue is the only way on. */
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); return; }
      trapFocus(card, e);
    }
    const overlay = el('div', { class: 'pw-overlay pw-welcome', 'data-no-translate': '' }, card);
    function close() {
      document.removeEventListener('keydown', onKey, true);
      overlay.classList.add('pw-out');
      setTimeout(function () { overlay.remove(); if (onDone) onDone(); }, reduced() ? 0 : 160);
    }
    overlay.closeNow = function () { document.removeEventListener('keydown', onKey, true); overlay.remove(); };
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey, true);
    btn.focus();
  }

  function welcomeOnLogin(uid) {
    const key = 'pbh-welcome:' + (uid || 'anon');
    if (get('sessionStorage', key)) return;
    set('sessionStorage', key, '1');
    setTimeout(function () { showWelcome(); }, 0);
  }

  function resetSession() {
    try {
      Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf('pbh-welcome:') === 0) sessionStorage.removeItem(k); });
    } catch (e) { /* storage off */ }
  }

  /* ---------- PassbookHub Pro ---------- */

  const BENEFITS = [
    ['ai', 'AI & Automation', 'Smarter insights and less manual tracking.'],
    ['infinity', 'Unlimited Planning', 'As many budgets, goals and plans as you need.'],
    ['brush', 'More customization', 'Make PassbookHub look and work your way.'],
    ['noads', 'Ad-free experience', 'Nothing between you and your money.']
  ];
  const TRIAL_DAYS = 7;

  function trialOf(uid) {
    try { const t = JSON.parse(get('localStorage', 'pbh.pro.' + (uid || 'anon')) || 'null'); return t && t.ends ? t : null; } catch (e) { return null; }
  }
  function trialActive(uid) { const t = trialOf(uid); return !!(t && t.ends > Date.now()); }

  /* Google Pay: loaded only when the Pro sheet opens. */
  let payLoad = null;
  function loadPay() {
    if (window.google && google.payments && google.payments.api) return Promise.resolve();
    if (payLoad) return payLoad;
    payLoad = new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = 'https://pay.google.com/gp/p/js/pay.js';
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { payLoad = null; reject(new Error('Google Pay could not load.')); };
      document.head.appendChild(s);
    });
    return payLoad;
  }
  function payConfig() {
    const c = (window.BudgetConfig && window.BudgetConfig.googlePay) || {};
    return {
      environment: c.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST',
      merchantId: c.merchantId || '',
      merchantName: c.merchantName || 'PassbookHub',
      gateway: c.gateway || 'example',
      gatewayMerchantId: c.gatewayMerchantId || 'exampleGatewayMerchantId',
      currency: c.currency || 'PHP',
      country: c.country || 'PH'
    };
  }
  function baseCard(cfg) {
    return {
      type: 'CARD',
      parameters: { allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'], allowedCardNetworks: ['MASTERCARD', 'VISA', 'JCB', 'AMEX'] },
      tokenizationSpecification: { type: 'PAYMENT_GATEWAY', parameters: { gateway: cfg.gateway, gatewayMerchantId: cfg.gatewayMerchantId } }
    };
  }
  async function startTrialWithGooglePay(uid) {
    const cfg = payConfig();
    await loadPay();
    const client = new google.payments.api.PaymentsClient({ environment: cfg.environment });
    const base = { apiVersion: 2, apiVersionMinor: 0 };
    const ready = await client.isReadyToPay(Object.assign({}, base, { allowedPaymentMethods: [baseCard(cfg)] }));
    if (!ready || !ready.result) throw new Error('Google Pay isn’t available on this browser or device.');
    const merchantInfo = { merchantName: cfg.merchantName };
    if (cfg.merchantId) merchantInfo.merchantId = cfg.merchantId;
    const data = await client.loadPaymentData(Object.assign({}, base, {
      allowedPaymentMethods: [baseCard(cfg)],
      merchantInfo: merchantInfo,
      transactionInfo: {
        totalPriceStatus: 'FINAL', totalPrice: '0.00', currencyCode: cfg.currency, countryCode: cfg.country,
        totalPriceLabel: TRIAL_DAYS + '-day free trial', checkoutOption: 'COMPLETE_IMMEDIATE_PURCHASE'
      }
    }));
    /* The payment token would go to your payment processor here to set up the subscription.
       Until a server does that, the trial is kept on this device. */
    const now = Date.now();
    set('localStorage', 'pbh.pro.' + (uid || 'anon'), JSON.stringify({ start: now, ends: now + TRIAL_DAYS * 86400000, env: cfg.environment, card: (data && data.paymentMethodData && data.paymentMethodData.description) || '' }));
    document.querySelectorAll('.pro-top-btn').forEach(function (b) { b.classList.add('is-pro'); });
  }

  function showPro(uid) {
    if (document.querySelector('.pw-overlay.pw-pro')) return;
    const opener = document.activeElement;
    const status = el('p', { class: 'pw-status', role: 'status', 'aria-live': 'polite' });
    const startBtn = el('button', { type: 'button', class: 'pw-primary' }, 'Start ' + TRIAL_DAYS + '-day free trial');
    const keepBtn = el('button', { type: 'button', class: 'pw-ghost', onclick: close }, 'Not now');
    const note = el('p', { class: 'pw-note' });

    function drawState() {
      const t = trialOf(uid);
      if (t && t.ends > Date.now()) {
        const end = new Date(t.ends).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        startBtn.textContent = 'Your free trial is active';
        startBtn.disabled = true;
        keepBtn.textContent = 'Done';
        note.textContent = 'Pro is yours until ' + end + '. Cancel anytime.';
      } else {
        note.textContent = 'Pay with Google Pay. Free for ' + TRIAL_DAYS + ' days, cancel anytime.';
      }
    }
    startBtn.addEventListener('click', async function () {
      if (startBtn.disabled) return;
      startBtn.disabled = true;
      status.textContent = 'Opening Google Pay…';
      try {
        await startTrialWithGooglePay(uid);
        status.textContent = 'Your ' + TRIAL_DAYS + '-day free trial has started.';
      } catch (err) {
        startBtn.disabled = false;
        const msg = err && (err.statusCode === 'CANCELED' ? '' : (err.statusMessage || err.message));
        status.textContent = msg || '';
      }
      drawState();
    });

    const card = el('div', { class: 'pw-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pp-title', 'aria-describedby': 'pp-sub' },
      el('div', { class: 'pw-head' },
        el('span', { class: 'pw-badge' }, svg('crown'), 'Pro'),
        el('h2', { id: 'pp-title', class: 'pw-title' }, 'PassbookHub Pro'),
        el('p', { id: 'pp-sub', class: 'pw-sub' }, 'Unlock the full PassbookHub experience. Start a free trial, cancel anytime.')),
      el('hr', { class: 'pw-rule' }),
      el('p', { class: 'pw-kicker' }, 'Pro benefits'),
      el('ul', { class: 'pw-list' }, BENEFITS.map(function (b) {
        return el('li', null, svg(b[0]), el('div', null, el('p', { class: 'pw-item' }, b[1]), el('p', { class: 'pw-desc' }, b[2])));
      })),
      el('div', { class: 'pw-foot pw-foot-col' }, startBtn, note, status, keepBtn));

    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); return; } trapFocus(card, e); }
    const overlay = el('div', { class: 'pw-overlay pw-pro', 'data-no-translate': '', onclick: function (e) { if (e.target === overlay) close(); } }, card);
    function close() {
      document.removeEventListener('keydown', onKey, true);
      overlay.classList.add('pw-out');
      setTimeout(function () { overlay.remove(); }, reduced() ? 0 : 160);
      if (opener && opener.focus && document.contains(opener)) opener.focus();
    }
    overlay.closeNow = function () { document.removeEventListener('keydown', onKey, true); overlay.remove(); };
    drawState();
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey, true);
    (startBtn.disabled ? keepBtn : startBtn).focus();
    loadPay().catch(function () { /* shown when the button is pressed */ });
  }

  function closeAll() {
    document.querySelectorAll('.pw-overlay').forEach(function (o) { if (o.closeNow) o.closeNow(); else o.remove(); });
  }

  return { welcomeOnLogin: welcomeOnLogin, showWelcome: showWelcome, showPro: showPro, resetSession: resetSession, closeAll: closeAll, trialActive: trialActive };
})();
