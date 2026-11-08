/* Games › Ziery Simulator.
   Like a room-builder idle game, but the only way to earn is good money habits:
   logging entries, saving and keeping to your split. Coins buy items from Ziery's
   wishlist, a delivery truck brings them, and the room fills up level by level.
   Coins and XP are worked out from your real entries, goals and badges every time,
   so they can't drift. Only what you bought and which boxes you opened are kept,
   on this device. Uses window.BT. No Firebase code here. */
window.ZIERY = (function () {
  'use strict';

  /* ---------- Levels ---------- */
  const MAX_LEVEL = 20;
  /** Total XP needed to reach a level. Level 1 is free; level 20 takes steady habits for months. */
  function xpFor(level) { return level <= 1 ? 0 : Math.round(60 * Math.pow(level - 1, 1.6)); }
  function levelOf(xp) {
    let l = 1;
    while (l < MAX_LEVEL && xp >= xpFor(l + 1)) l++;
    return l;
  }
  const TITLES = [
    [20, 'Financial Independence Ziery', 'Fully furnished, a mini vault, and every wishlist item checked.'],
    [10, 'Budget Master Ziery', 'Ergonomic chair, dual monitors and a smart savings jar.'],
    [5, 'Kinsenas Survivor Ziery', 'A small study desk and a plastic alkansya. Payday to payday, and still saving.'],
    [1, 'Petsa de Peligro Ziery', 'Kape 3-in-1, an old electric fan and a banig. Everyone starts somewhere.']
  ];
  function titleOf(level) { return TITLES.find(function (t) { return level >= t[0]; }); }

  /* ---------- Items ----------
     [id, name, emoji, level, coins, x%, y%, size, layer, replaces, note]
     x/y place the item's bottom-centre in the room. size is in % of the room width. */
  const ITEMS = [
    ['banig', 'Banig', null, 1, 0, 24, 92, 0, 1, null, 'Where Ziery sleeps for now.'],
    ['tokador', 'Lumang tokador', '🗄️', 1, 0, 9, 74, 12, 2, null, 'Hand-me-down drawers.'],
    ['fan', 'Lumang electric fan', '🪭', 1, 0, 90, 80, 8, 3, null, 'Squeaks on level 2.'],
    ['kape', 'Kape 3-in-1', '☕', 1, 0, 6, 55, 4.5, 4, null, 'Breakfast of champions.'],
    ['alkansya', 'Plastic na alkansya', '🐷', 2, 120, 12, 55, 5, 4, null, 'Every coin counts.'],
    ['halaman', 'Halaman', '🪴', 3, 100, 96, 93, 6, 3, null, 'A little green.'],
    ['desk', 'Study desk', null, 4, 350, 66, 76, 0, 2, null, 'A real place to log your budget.'],
    ['lamp', 'Desk lamp', '💡', 4, 150, 56, 61, 4, 4, null, 'For late-night logging.'],
    ['sapatos', 'Bagong sapatos', '👟', 5, 400, 37, 95, 5, 3, null, 'Paid in cash, not utang.'],
    ['chair', 'Study chair', '🪑', 5, 300, 72, 90, 7, 3, null, 'Better than sitting on the floor.'],
    ['kama', 'Kama', '🛏️', 6, 800, 24, 93, 16, 2, 'banig', 'Goodbye, banig.'],
    ['laptop', 'Laptop', '💻', 6, 900, 62, 61, 6, 4, null, 'Work, study and budget on it.'],
    ['headphones', 'Headphones', '🎧', 7, 350, 77, 61, 3.5, 4, null, 'Focus mode on.'],
    ['keyboard', 'Mechanical keyboard', '⌨️', 8, 600, 66, 63, 5, 5, null, 'Clicky. Worth every peso saved.'],
    ['shelf', 'Book shelf', '📚', 8, 300, 30, 48, 6, 2, null, 'Money books, mostly.'],
    ['aircon', 'Aircon', '❄️', 9, 1200, 86, 24, 6, 2, 'fan', 'No more pawis.'],
    ['ergochair', 'Ergonomic chair', '💺', 10, 1000, 72, 90, 8, 3, 'chair', 'Your back says thank you.'],
    ['monitors', 'Dual monitor', '🖥️', 10, 1500, 69, 60, 6, 3, null, 'Two screens, twice the spreadsheets.'],
    ['jar', 'Smart savings jar', '🫙', 10, 700, 12, 55, 5, 4, 'alkansya', 'Counts every deposit.'],
    ['frame', 'Framed goal', '🖼️', 11, 250, 22, 32, 6, 2, null, 'A picture of the dream.'],
    ['rug', 'Rug', null, 12, 400, 48, 97, 0, 1, null, 'Ties the room together.'],
    ['speaker', 'Speaker', '🔊', 12, 500, 80, 93, 3.5, 4, null, 'Payday playlist.'],
    ['guitar', 'Gitara', '🎸', 13, 900, 88, 93, 7, 3, null, 'Weekend jamming.'],
    ['tv', 'Smart TV', '📺', 14, 1400, 33, 66, 8, 3, null, 'Paid in full.'],
    ['rig', 'Gaming rig', '🎮', 15, 1800, 73, 63, 4, 5, null, 'The full setup.'],
    ['bakasyon', 'Pondo sa bakasyon', '🧳', 16, 2500, 41, 72, 6, 3, null, 'The trip is funded.'],
    ['lights', 'Fairy lights', null, 17, 600, 50, 1, 0, 1, null, 'Dream room vibes.'],
    ['vault', 'Mini vault', '🔐', 18, 3000, 5, 95, 7, 3, null, 'The savings vault.'],
    ['trophy', 'FI trophy', '🏆', 20, 5000, 50, 67, 5, 4, null, 'Financial independence.']
  ].map(function (r) {
    return { id: r[0], name: r[1], emoji: r[2], level: r[3], price: r[4], x: r[5], y: r[6], size: r[7], layer: r[8], replaces: r[9], note: r[10] };
  });
  const BY_ID = {};
  ITEMS.forEach(function (i) { BY_ID[i.id] = i; });

  /* ---------- Saved on this device ---------- */
  function key(uid) { return 'pbh.ziery.' + uid; }
  function load(uid) {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(key(uid)) || 'null'); } catch (e) { s = null; }
    s = s && typeof s === 'object' ? s : {};
    return { owned: Array.isArray(s.owned) ? s.owned.filter(function (id) { return BY_ID[id]; }) : [], spent: +s.spent || 0, boxes: +s.boxes || 0 };
  }
  function save(uid, s) { try { localStorage.setItem(key(uid), JSON.stringify(s)); } catch (e) { /* storage off */ } }

  /* ---------- Earnings, from your real data ---------- */
  const PER_ENTRY = [5, 10];        /* coins, XP for each entry you log */
  const PER_DAY = [10, 15];         /* for each day you logged anything */
  const PER_SAVED = 20;             /* one coin per ₱20 put into savings */
  const PER_SPLIT_MONTH = [300, 250];
  const PER_BADGE = [20, 30];
  const BOX_EVERY = 100000;         /* a delivery box for every ₱1,000.00 saved */
  const PER_BOX = [80, 40];

  function earnings(input) {
    const txs = input.txs || [];
    const days = {};
    let savedEntries = 0;
    const months = {};
    txs.forEach(function (t) {
      if (t.date) days[t.date] = true;
      if (t.type === 'savings') savedEntries += t.cents;
      const m = (t.date || '').slice(0, 7);
      const x = months[m] || (months[m] = { income: 0, needs: 0, wants: 0, savings: 0 });
      if (x[t.type] !== undefined) x[t.type] += t.cents;
    });
    const goalSaved = (input.goals || []).reduce(function (a, g) { return a + (g.savedCents || 0); }, 0);
    const saved = Math.max(savedEntries, goalSaved);
    const shares = (input.plan && input.plan.shares) || { needs: 50, wants: 30, savings: 20 };
    const thisMonth = (input.today || '').slice(0, 7);
    const splitMonths = Object.keys(months).filter(function (m) {
      const x = months[m];
      return m < thisMonth && x.income > 0 && x.needs <= x.income * shares.needs / 100 && x.wants <= x.income * shares.wants / 100 && x.savings >= x.income * shares.savings / 100;
    }).length;
    const dayCount = Object.keys(days).length;
    const savedCoins = Math.floor(saved / (PER_SAVED * 100));
    const savedXp = Math.floor(saved / 10000) * 2;
    const boxesReached = Math.floor(saved / BOX_EVERY);
    const opened = Math.min(input.store.boxes, boxesReached);
    const rows = [
      ['Entries logged', txs.length, txs.length * PER_ENTRY[0], txs.length * PER_ENTRY[1]],
      ['Days you logged', dayCount, dayCount * PER_DAY[0], dayCount * PER_DAY[1]],
      ['Money saved', null, savedCoins, savedXp, saved],
      ['Months on your split', splitMonths, splitMonths * PER_SPLIT_MONTH[0], splitMonths * PER_SPLIT_MONTH[1]],
      ['Badges earned', input.badges || 0, (input.badges || 0) * PER_BADGE[0], (input.badges || 0) * PER_BADGE[1]],
      ['Delivery boxes opened', opened, opened * PER_BOX[0], opened * PER_BOX[1]]
    ];
    const coins = rows.reduce(function (a, r) { return a + r[2]; }, 0);
    const xp = rows.reduce(function (a, r) { return a + r[3]; }, 0);
    return { rows: rows, coins: coins, xp: xp, saved: saved, boxesReached: boxesReached, boxesWaiting: boxesReached - opened, nextBoxAt: (boxesReached + 1) * BOX_EVERY };
  }

  /* ---------- The view ---------- */
  function render(ctx) {
    const h = ctx.h, toast = ctx.toast, user = ctx.user;
    const money = function (cents) { return BT.formatMoney(cents, user.currency); };
    const fmt = function (n) { return Number(n).toLocaleString('en-PH'); };
    const store = load(user.id);
    let delivering = null;     /* the item the truck is bringing right now */
    let justPlaced = null;
    let shopFilter = 'wishlist';

    const hud = h('section', { class: 'zr-hud', 'aria-label': 'Ziery’s progress' });
    const room = h('div', { class: 'zr-room', role: 'img' });
    const roomWrap = h('section', { class: 'zr-stage', 'aria-label': 'Ziery’s room' }, room);
    const boxBar = h('div', { class: 'zr-boxbar' });
    const shop = h('section', { class: 'zr-card zr-shop', 'aria-labelledby': 'zr-shop-h' });
    const earn = h('section', { class: 'zr-card zr-earn', 'aria-labelledby': 'zr-earn-h' });
    const ladder = h('section', { class: 'zr-card zr-ladder', 'aria-labelledby': 'zr-ladder-h' });

    function state() {
      const e = earnings({ txs: BT.listTx(), goals: ctx.goals(), plan: BT.getPlan(), badges: ctx.badges(), today: BT.today(), store: store });
      const level = levelOf(e.xp);
      const owned = {};
      ITEMS.forEach(function (i) { if (i.price === 0) owned[i.id] = true; });
      store.owned.forEach(function (id) { owned[id] = true; });
      return { e: e, level: level, coins: Math.max(0, e.coins - store.spent), owned: owned };
    }

    function shown(s) {
      /* An item is in the room if you own it and nothing you own replaced it. */
      const replaced = {};
      ITEMS.forEach(function (i) { if (i.replaces && s.owned[i.id]) replaced[i.replaces] = true; });
      return ITEMS.filter(function (i) { return s.owned[i.id] && !replaced[i.id] && i.id !== delivering; });
    }

    function drawHud(s) {
      const t = titleOf(s.level);
      const from = xpFor(s.level), to = xpFor(Math.min(MAX_LEVEL, s.level + 1));
      const pct = s.level >= MAX_LEVEL ? 100 : Math.round((s.e.xp - from) / Math.max(1, to - from) * 100);
      hud.replaceChildren(
        h('div', { class: 'zr-who' },
          h('span', { class: 'zr-lvl num', 'aria-label': 'Level ' + s.level }, String(s.level)),
          h('div', { class: 'zr-who-text' },
            h('p', { class: 'zr-title' }, t[1]),
            h('div', { class: 'zr-xpbar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': 'Savings XP to next level' }, h('span', { style: 'width:' + pct + '%' })),
            h('p', { class: 'zr-sub num' }, s.level >= MAX_LEVEL ? fmt(s.e.xp) + ' Savings XP · max level' : fmt(s.e.xp - from) + ' / ' + fmt(to - from) + ' Savings XP to level ' + (s.level + 1)))),
        h('div', { class: 'zr-stats' },
          h('div', { class: 'zr-stat' }, h('span', { class: 'zr-stat-k' }, 'Cash Coins'), h('span', { class: 'zr-stat-v num' }, '🪙 ' + fmt(s.coins))),
          h('div', { class: 'zr-stat' }, h('span', { class: 'zr-stat-k' }, 'Total saved'), h('span', { class: 'zr-stat-v num' }, money(s.e.saved)))));
    }

    function drawRoom(s) {
      const tier = s.level >= 20 ? 'dream' : s.level >= 10 ? 'aesthetic' : s.level >= 5 ? 'cozy' : 'bare';
      room.className = 'zr-room zr-' + tier;
      room.setAttribute('aria-label', 'Ziery’s room, level ' + s.level + ': ' + shown(s).map(function (i) { return i.name; }).join(', '));
      const items = shown(s).sort(function (a, b) { return a.layer - b.layer || a.y - b.y; });
      const nodes = [
        h('div', { class: 'zr-wall' }), h('div', { class: 'zr-floor' }),
        h('div', { class: 'zr-window' }, h('span'), h('span')),
        board(s)
      ];
      items.forEach(function (i) {
        const style = 'left:' + i.x + '%;top:' + i.y + '%;--s:' + i.size + ';z-index:' + (i.layer * 10 + Math.round(i.y / 10));
        const cls = 'zr-item zr-' + i.id + (justPlaced === i.id ? ' zr-pop' : '');
        nodes.push(i.emoji ? h('span', { class: cls, style: style, title: i.name }, i.emoji) : h('span', { class: cls, style: style, title: i.name }));
      });
      const coder = s.owned.laptop || s.owned.monitors;
      nodes.push(h('span', { class: 'zr-ziery' + (coder ? ' at-desk' : ''), title: 'Ziery' }, coder ? '🧑‍💻' : '🧍'));
      if (delivering) nodes.push(h('div', { class: 'zr-truck', 'aria-hidden': 'true' }, h('span', { class: 'zr-truck-box' }, '📦'), '🚚'));
      room.replaceChildren.apply(room, nodes);
      justPlaced = null;
    }

    /* The wishlist board on the wall: the next three things to save for. */
    function board(s) {
      const next = ITEMS.filter(function (i) { return i.price > 0 && !s.owned[i.id]; }).slice(0, 3);
      return h('div', { class: 'zr-board', title: 'Wishlist' },
        h('span', { class: 'zr-board-h' }, 'Wishlist'),
        next.length ? next.map(function (i) {
          return h('span', { class: 'zr-pin' + (s.coins >= i.price && s.level >= i.level ? ' ready' : '') }, i.emoji || '✦');
        }) : h('span', { class: 'zr-pin ready' }, '✓'));
    }

    function drawBoxes(s) {
      if (s.e.boxesWaiting > 0) {
        boxBar.replaceChildren(
          h('span', { class: 'zr-box-icon', 'aria-hidden': 'true' }, '📦'),
          h('span', { class: 'zr-box-text' }, h('strong', null, s.e.boxesWaiting === 1 ? 'A delivery box arrived!' : s.e.boxesWaiting + ' delivery boxes arrived!'),
            h('span', { class: 'small muted' }, 'One for every ' + money(BOX_EVERY) + ' you’ve saved.')),
          h('button', { type: 'button', class: 'btn primary', onclick: openBox }, 'Open'));
      } else {
        const left = s.e.nextBoxAt - s.e.saved;
        const pct = Math.round((s.e.saved % BOX_EVERY) / BOX_EVERY * 100);
        boxBar.replaceChildren(
          h('span', { class: 'zr-box-icon muted', 'aria-hidden': 'true' }, '🚚'),
          h('span', { class: 'zr-box-text' }, h('strong', null, 'Next delivery box'),
            h('span', { class: 'small muted num' }, 'Save ' + money(left) + ' more to unlock it.')),
          h('span', { class: 'zr-mini', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Next delivery box' }, h('span', { style: 'width:' + pct + '%' })));
      }
    }

    function openBox() {
      store.boxes += 1;
      save(user.id, store);
      if (window.PBH_FX) PBH_FX.celebrate();
      toast('📦 +' + PER_BOX[0] + ' Cash Coins and +' + PER_BOX[1] + ' Savings XP!');
      draw();
    }

    function drawShop(s) {
      const filters = [['wishlist', 'Wishlist'], ['owned', 'In the room'], ['all', 'All items']];
      const list = ITEMS.filter(function (i) {
        if (i.price === 0) return shopFilter === 'owned' || shopFilter === 'all';
        if (shopFilter === 'wishlist') return !s.owned[i.id];
        if (shopFilter === 'owned') return s.owned[i.id];
        return true;
      });
      shop.replaceChildren(
        h('div', { class: 'zr-card-head' }, h('h2', { id: 'zr-shop-h' }, 'Wishlist'),
          h('div', { class: 'zr-seg', role: 'group', 'aria-label': 'Show items' }, filters.map(function (f) {
            return h('button', { type: 'button', 'aria-pressed': shopFilter === f[0] ? 'true' : 'false', onclick: function () { shopFilter = f[0]; drawShop(state()); } }, f[1]);
          }))),
        list.length ? h('ul', { class: 'zr-items' }, list.map(function (i) {
          const own = s.owned[i.id];
          const locked = !own && s.level < i.level;
          const enough = s.coins >= i.price;
          const pct = own ? 100 : Math.min(100, Math.round(s.coins / Math.max(1, i.price) * 100));
          let action;
          if (own) action = h('span', { class: 'zr-tag good' }, i.price ? 'Bought' : 'Starter');
          else if (locked) action = h('span', { class: 'zr-tag' }, 'Level ' + i.level);
          else action = h('button', { type: 'button', class: 'btn' + (enough ? ' primary' : ''), disabled: !enough || !!delivering, onclick: function () { buy(i); } }, enough ? 'Buy' : 'Save up');
          return h('li', { class: 'zr-row' + (locked ? ' locked' : '') + (own ? ' owned' : '') },
            h('span', { class: 'zr-row-emoji', 'aria-hidden': 'true' }, i.emoji || (i.id === 'banig' ? '🟫' : i.id === 'desk' ? '🪵' : i.id === 'rug' ? '🟪' : '✨')),
            h('div', { class: 'zr-row-main' },
              h('div', { class: 'zr-row-top' }, h('span', { class: 'zr-row-name' }, i.name), i.price ? h('span', { class: 'zr-row-price num' }, '🪙 ' + fmt(i.price)) : null),
              h('p', { class: 'zr-row-note small muted' }, i.note + (i.replaces ? ' Replaces the ' + BY_ID[i.replaces].name.toLowerCase() + '.' : '')),
              !own && !locked ? h('span', { class: 'zr-mini' }, h('span', { style: 'width:' + pct + '%' })) : null),
            action);
        })) : h('p', { class: 'zr-empty small muted' }, shopFilter === 'wishlist' ? 'Every wishlist item is checked. Financial independence unlocked!' : 'Nothing here yet.'));
    }

    function buy(item) {
      const s = state();
      if (s.owned[item.id] || s.level < item.level || s.coins < item.price || delivering) return;
      store.owned.push(item.id);
      store.spent += item.price;
      save(user.id, store);
      delivering = item.id;
      draw();
      roomWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      /* The truck drives in, drops the box, and the item pops into place. */
      setTimeout(function () {
        if (!room.isConnected) return;
        delivering = null; justPlaced = item.id;
        if (window.PBH_FX) PBH_FX.celebrate();
        toast('🚚 ' + item.name + ' was delivered to Ziery’s room!');
        draw();
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 2200);
    }

    function drawEarn(s) {
      earn.replaceChildren(
        h('div', { class: 'zr-card-head' }, h('h2', { id: 'zr-earn-h' }, 'How Ziery earns')),
        h('p', { class: 'small muted' }, 'Coins and XP come only from your real money habits. Keep logging and saving to level up.'),
        h('table', { class: 'zr-table' },
          h('thead', null, h('tr', null, h('th', null, 'Habit'), h('th', { class: 'r' }, 'Coins'), h('th', { class: 'r' }, 'XP'))),
          h('tbody', null, s.e.rows.map(function (r) {
            return h('tr', null,
              h('td', null, r[0], h('span', { class: 'zr-count num' }, r[4] !== undefined ? money(r[4]) : fmt(r[1]))),
              h('td', { class: 'r num' }, fmt(r[2])), h('td', { class: 'r num' }, fmt(r[3])));
          })),
          h('tfoot', null, h('tr', null, h('td', null, 'Earned in total'), h('td', { class: 'r num' }, fmt(s.e.coins)), h('td', { class: 'r num' }, fmt(s.e.xp))))),
        h('ul', { class: 'zr-tips small muted' },
          h('li', null, '+' + PER_ENTRY[0] + ' coins for every entry, +' + PER_DAY[0] + ' more for each day you log.'),
          h('li', null, '1 coin for every ' + money(PER_SAVED * 100) + ' you put into savings.'),
          h('li', null, '+' + PER_SPLIT_MONTH[0] + ' coins for each month you finish on your 50/30/20 split.')),
        h('div', { class: 'zr-actions' }, h('a', { class: 'btn', href: '#budget-plan' }, 'Log an entry')));
    }

    function drawLadder(s) {
      ladder.replaceChildren(
        h('div', { class: 'zr-card-head' }, h('h2', { id: 'zr-ladder-h' }, 'Levels')),
        h('ol', { class: 'zr-steps' }, TITLES.slice().reverse().map(function (t) {
          const done = s.level >= t[0];
          return h('li', { class: done ? 'done' : '' },
            h('span', { class: 'zr-step-n num' }, String(t[0])),
            h('div', null, h('p', { class: 'zr-step-t' }, t[1]), h('p', { class: 'small muted' }, t[2])));
        })));
    }

    function draw() {
      const s = state();
      drawHud(s); drawRoom(s); drawBoxes(s); drawShop(s); drawEarn(s); drawLadder(s);
    }

    const page = h('div', { class: 'wide games zr' },
      h('p', { class: 'bd-kicker' }, 'Games'),
      h('h1', null, 'Ziery Simulator'),
      h('p', { class: 'muted bd-lead' }, 'Help Ziery turn a bare room into a dream room. Good money habits earn Cash Coins and Savings XP; spend them on wishlist items and a delivery truck brings them home. Purchases are saved on this device.'),
      hud,
      h('div', { class: 'zr-main' },
        h('div', { class: 'zr-left' }, roomWrap, boxBar, earn),
        h('div', { class: 'zr-right' }, shop, ladder)));
    draw();
    return { el: page, refresh: draw };
  }

  return { render: render, ITEMS: ITEMS, levelOf: levelOf, xpFor: xpFor, earnings: earnings };
})();
