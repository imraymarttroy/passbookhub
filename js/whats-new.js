/*
 * Features pop-up shown once per login, closable with X, "Got it", Esc or a click outside.
 * "Don't show this again" hides it per user until FEATURES_VERSION changes.
 * Edit FEATURES / COMING_SOON below to change what it lists. Open it any time with WHATS_NEW.show().
 */
window.WHATS_NEW = (function () {
  'use strict';

  // Bump this when you add new features — users who ticked "Don't show again" will see it once more.
  const FEATURES_VERSION = '2026-11';

  const FEATURES = [
    { icon: '📊', en: ['50/30/20 budget', 'Split your income into needs, wants and savings automatically.'],
                  fil: ['50/30/20 na budget', 'Hatiin ang kita sa needs, wants at savings nang awtomatiko.'] },
    { icon: '🧾', en: ['Track every peso', 'Log income and expenses by category, with an alert when you are almost at your limit.'],
                  fil: ['Bantayan ang bawat piso', 'Itala ang kita at gastos ayon sa kategorya, may babala kapag malapit ka na sa limit.'] },
    { icon: '🎯', en: ['Savings goals', 'Set targets and dates, and start an emergency fund in one tap.'],
                  fil: ['Savings goals', 'Magtakda ng target at petsa, at magsimula ng emergency fund sa isang tap.'] },
    { icon: '💳', en: ['Debts and due dates', 'Track what you owe and who owes you, with due-soon and overdue labels.'],
                  fil: ['Utang at due dates', 'Alamin kung magkano ang utang mo at sino ang may utang sa iyo, may due soon at overdue na label.'] },
    { icon: '📄', en: ['Monthly statement', 'See income, spending and savings for any month, and save it as a PDF.'],
                  fil: ['Buwanang statement', 'Tingnan ang kita, gastos at ipon kada buwan, at i-save bilang PDF.'] },
    { icon: '💰', en: ['Net worth at a glance', 'Your total savings minus what you owe, right on your dashboard.'],
                  fil: ['Net worth agad-agad', 'Kabuuang ipon bawas ang utang, makikita agad sa dashboard.'] },
    { icon: '👥', en: ['Your Circle', 'Add friends and family, share posts and send messages.'],
                  fil: ['Ang iyong Circle', 'Idagdag ang pamilya at kaibigan, mag-post at mag-message.'] },
    { icon: '🤖', en: ['PassbookHub AI', 'Ask about budgeting, saving, debt and investing.'],
                  fil: ['PassbookHub AI', 'Magtanong tungkol sa budgeting, pag-iipon, utang at investing.'] },
    { icon: '🔒', en: ['Two-step verification', 'Protect your account with a one-time code.'],
                  fil: ['Two-step verification', 'Protektahan ang account gamit ang one-time code.'] },
  ];

  // Set to [] to hide the "Coming soon" section.
  const COMING_SOON = {
    en: ['Bill reminders', 'Expense splitter', 'Shared savings goals', 'Wishlist', 'Financial calendar'],
    fil: ['Paalala sa bayarin', 'Hatian ng gastos', 'Shared na savings goals', 'Wishlist', 'Financial calendar'],
  };

  const TEXT = {
    en: { title: "What's in PassbookHub", sub: 'Here is everything you can do. You can close this anytime.',
          soon: 'Coming soon', hide: "Don't show this again", ok: 'Got it', close: 'Close' },
    fil: { title: 'Mga feature ng PassbookHub', sub: 'Narito ang lahat ng magagawa mo. Puwede mo itong isara anumang oras.',
           soon: 'Malapit na', hide: 'Huwag nang ipakita ulit', ok: 'Sige', close: 'Isara' },
  };

  function lang() {
    const l = (document.documentElement.lang || '').toLowerCase();
    return l.startsWith('fil') || l.startsWith('tl') ? 'fil' : 'en';
  }

  // Storage can throw (private mode, blocked storage) — never let that break login.
  function get(store, key) { try { return window[store].getItem(key); } catch (e) { return null; } }
  function set(store, key, val) { try { window[store].setItem(key, val); } catch (e) { /* ignore */ } }

  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'class') n.className = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach((c) => c != null && n.append(c));
    return n;
  }

  /** Call once after login. Shows the pop-up unless it was already shown this session or hidden by the user. */
  function showFeaturesOnLogin(uid) {
    const id = uid || 'anon';
    if (get('localStorage', `pbh-features-hidden:${id}`) === FEATURES_VERSION) return;
    if (get('sessionStorage', `pbh-features-seen:${id}`)) return;
    set('sessionStorage', `pbh-features-seen:${id}`, '1');
    showFeatures(id);
  }

  /** Opens the pop-up right away. */
  function showFeatures(uid) {
    if (document.querySelector('.feat-overlay')) return;
    const L = lang();
    const t = TEXT[L];
    const opener = document.activeElement;
    const hideBox = el('input', { type: 'checkbox', id: 'feat-hide' });

    function close() {
      if (hideBox.checked) set('localStorage', `pbh-features-hidden:${uid || 'anon'}`, FEATURES_VERSION);
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('feat-out');
      setTimeout(() => overlay.remove(), 160);
      if (opener && opener.focus) opener.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') { // keep focus inside the pop-up
        const f = card.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    const xBtn = el('button', { class: 'feat-x', type: 'button', 'aria-label': t.close, onclick: close },
      el('span', { 'aria-hidden': 'true' }, '×'));

    const list = el('ul', { class: 'feat-list' },
      FEATURES.map((f) => el('li', { class: 'feat-item' },
        el('span', { class: 'feat-ico', 'aria-hidden': 'true' }, f.icon),
        el('div', {}, el('strong', {}, f[L][0]), el('p', {}, f[L][1])))));

    const soonItems = COMING_SOON[L] || [];
    const soon = soonItems.length
      ? el('div', { class: 'feat-soon' },
          el('h3', {}, t.soon),
          el('div', { class: 'feat-chips' }, soonItems.map((s) => el('span', { class: 'feat-chip' }, s))))
      : null;

    const card = el('div', { class: 'feat-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'feat-title' },
      xBtn,
      el('h2', { id: 'feat-title' }, t.title),
      el('p', { class: 'feat-sub' }, t.sub),
      list,
      soon,
      el('div', { class: 'feat-foot' },
        el('label', { class: 'feat-hide' }, hideBox, ' ', t.hide),
        el('button', { class: 'feat-ok', type: 'button', onclick: close }, t.ok)));

    const overlay = el('div', { class: 'feat-overlay', 'data-no-translate': '', onclick: (e) => { if (e.target === overlay) close(); } }, card);
    document.body.append(overlay);
    document.addEventListener('keydown', onKey);
    xBtn.focus();
  }

  /** Call on sign-out so the next login shows the pop-up again. */
  function resetSession() {
    try {
      Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf('pbh-features-seen:') === 0) sessionStorage.removeItem(k); });
    } catch (e) { /* storage may be off */ }
  }

  return { showOnLogin: showFeaturesOnLogin, show: showFeatures, resetSession: resetSession, version: FEATURES_VERSION };
})();
