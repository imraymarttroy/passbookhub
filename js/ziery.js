/* Games › Ziery Simulator: a room-and-vlog creator game.
   Ziery records vlogs on money topics. Uploads earn Views, Subscribers and Ipon Coins.
   Coins buy room items; each item boosts some vlog topics, arrives by delivery truck after
   a real-time wait, and is placed on the room grid. Subscribers raise Ziery's level.
   Real money habits help too: logging today, your streak and months on your split boost
   every upload, and your saving and logging pay a habit allowance in coins.
   Everything is kept on this device. Uses window.BT. No Firebase code here. */
window.ZIERY = (function () {
  'use strict';

  /* ---------- Levels (by subscribers) ---------- */
  const MAX_LEVEL = 20;
  function subsFor(level) { return level <= 1 ? 0 : Math.round(50 * Math.pow(level - 1, 2.2)); }
  function levelOf(subs) { let l = 1; while (l < MAX_LEVEL && subs >= subsFor(l + 1)) l++; return l; }
  const TITLES = [
    [20, 'Financial Independence Ziery', 'Fully furnished, a mini vault, and every wishlist item checked.'],
    [10, 'Budget Master Ziery', 'Ergonomic chair, dual monitor and a smart savings jar.'],
    [5, 'Kinsenas Survivor Ziery', 'A small setup and a plastic alkansya. Payday to payday, still uploading.'],
    [1, 'Petsa de Peligro Ziery', 'Kape 3-in-1, an old electric fan and a banig. Everyone starts somewhere.']
  ];
  function titleOf(level) { return TITLES.find(function (t) { return level >= t[0]; }); }

  /* ---------- Vlog topics and lengths ---------- */
  const TOPICS = [
    ['ipon', 'Ipon tips', '🐷'], ['budget', 'Budget vlog', '📊'], ['food', 'Food trip', '🍜'],
    ['tech', 'Tech review', '💻'], ['travel', 'Travel', '🧳'], ['gaming', 'Gaming', '🎮']
  ];
  const LENGTHS = [['short', 'Short', 30, 1], ['regular', 'Regular', 120, 2.6], ['long', 'Long', 300, 5.5]];
  /** Two topics trend at a time, changing every 2 hours. The same for everyone. */
  function trending(now) {
    const block = Math.floor(now / 7200000);
    const a = (block * 7 + 3) % TOPICS.length;
    let b = (block * 5 + 1) % TOPICS.length;
    if (b === a) b = (b + 1) % TOPICS.length;
    return { ids: [TOPICS[a][0], TOPICS[b][0]], until: (block + 1) * 7200000 };
  }

  /* ---------- Room grid ---------- */
  const COLS = 10, ROWS = 6, WALL_ROWS = 3;   /* rows 0–2 are the wall, 3–5 the floor */

  /* ---------- Items ----------
     [id, name, emoji, level, coins, deliveryMinutes, zone, size, boosts, note]
     boosts: { topic: percent } or { all: percent }. */
  const ITEMS = [
    ['banig', 'Banig', '🟫', 1, 0, 0, 'floor', 1, {}, 'Where Ziery sleeps for now.'],
    ['tokador', 'Lumang tokador', '🗄️', 1, 0, 0, 'floor', 1, { ipon: 5 }, 'Hand-me-down drawers.'],
    ['fan', 'Lumang electric fan', '🪭', 1, 0, 0, 'floor', 0.9, { all: 2 }, 'Squeaks on level 2.'],
    ['kape', 'Kape 3-in-1', '☕', 1, 0, 0, 'floor', 0.6, { budget: 5 }, 'Breakfast of champions.'],
    ['alkansya', 'Plastic na alkansya', '🐷', 1, 120, 1, 'floor', 0.7, { ipon: 15 }, 'Every coin counts.'],
    ['calculator', 'Calculator', '🧮', 1, 150, 1, 'floor', 0.7, { budget: 15 }, 'For the monthly math.'],
    ['halaman', 'Halaman', '🪴', 2, 100, 1, 'floor', 0.9, { all: 3 }, 'A little green on camera.'],
    ['ricecooker', 'Rice cooker', '🍚', 2, 250, 2, 'floor', 0.8, { food: 15 }, 'Baon season.'],
    ['ringlight', 'Ring light', '💡', 3, 300, 3, 'floor', 0.9, { all: 6 }, 'Good lighting, more views.'],
    ['calendar', 'Kalendaryo', '🗓️', 3, 200, 2, 'wall', 0.9, { budget: 10 }, 'Payday circled in red.'],
    ['laptop', 'Laptop', '💻', 4, 900, 5, 'floor', 0.9, { tech: 20, budget: 10 }, 'Edit, upload and budget on it.'],
    ['camera', 'Camera', '📷', 4, 700, 5, 'floor', 0.8, { all: 10 }, 'Sharper vlogs.'],
    ['mic', 'Microphone', '🎙️', 5, 600, 4, 'floor', 0.8, { all: 8 }, 'No more echo.'],
    ['sapatos', 'Bagong sapatos', '👟', 5, 400, 3, 'floor', 0.8, { travel: 12 }, 'Paid in cash, not utang.'],
    ['books', 'Money books', '📚', 5, 300, 3, 'floor', 0.8, { budget: 10, ipon: 10 }, 'Read, then make a vlog about it.'],
    ['headphones', 'Headphones', '🎧', 6, 350, 4, 'floor', 0.7, { gaming: 12 }, 'Focus mode on.'],
    ['kama', 'Kama', '🛏️', 6, 800, 8, 'floor', 1.4, { all: 5 }, 'Goodbye, banig.'],
    ['map', 'World map', '🗺️', 6, 400, 4, 'wall', 1, { travel: 15 }, 'Pins on the next trip.'],
    ['keyboard', 'Mechanical keyboard', '⌨️', 7, 600, 6, 'floor', 0.8, { tech: 15, gaming: 10 }, 'Clicky. Worth every peso saved.'],
    ['aircon', 'Aircon', '❄️', 7, 1200, 10, 'wall', 1, { all: 8 }, 'No more pawis on camera.'],
    ['clock', 'Wall clock', '⏰', 8, 300, 4, 'wall', 0.8, { budget: 8 }, 'Upload on schedule.'],
    ['ergochair', 'Ergonomic chair', '💺', 8, 1000, 10, 'floor', 1, { all: 6 }, 'Your back says thank you.'],
    ['monitor', 'Dual monitor', '🖥️', 9, 1500, 12, 'floor', 1, { tech: 20, gaming: 15 }, 'Two screens, twice the edits.'],
    ['jar', 'Smart savings jar', '🫙', 9, 700, 8, 'floor', 0.7, { ipon: 25 }, 'Counts every deposit.'],
    ['frame', 'Framed goal', '🖼️', 10, 250, 4, 'wall', 1, { travel: 10, ipon: 5 }, 'A picture of the dream.'],
    ['speaker', 'Speaker', '🔊', 10, 500, 6, 'floor', 0.8, { gaming: 8, food: 5 }, 'Payday playlist.'],
    ['guitar', 'Gitara', '🎸', 11, 900, 10, 'floor', 1, { all: 5 }, 'Intro music, homemade.'],
    ['tv', 'Smart TV', '📺', 12, 1400, 15, 'floor', 1.1, { gaming: 15, food: 10 }, 'Paid in full.'],
    ['award', '100K Ipon Award', '🏅', 12, 800, 8, 'wall', 0.9, { all: 10 }, 'Ziery’s own milestone plaque.'],
    ['controller', 'Gaming rig', '🎮', 13, 1800, 15, 'floor', 0.8, { gaming: 25 }, 'The full setup.'],
    ['luggage', 'Pondo sa bakasyon', '🧳', 14, 2500, 20, 'floor', 0.9, { travel: 25 }, 'The trip is funded.'],
    ['lights', 'Fairy lights', '✨', 15, 600, 6, 'wall', 0.9, { all: 6 }, 'Dream room vibes.'],
    ['vault', 'Mini vault', '🔐', 17, 3000, 25, 'floor', 1, { ipon: 40 }, 'The savings vault.'],
    ['trophy', 'FI trophy', '🏆', 20, 5000, 30, 'floor', 0.9, { all: 15 }, 'Financial independence.']
  ].map(function (r) {
    return { id: r[0], name: r[1], emoji: r[2], level: r[3], price: r[4], mins: r[5], zone: r[6], size: r[7], boosts: r[8], note: r[9] };
  });
  const BY_ID = {};
  ITEMS.forEach(function (i) { BY_ID[i.id] = i; });
  const STARTER = [['banig', 1, 5], ['tokador', 0, 4], ['kape', 1, 4], ['fan', 9, 4]];

  /* ---------- Saved on this device ---------- */
  function key(uid) { return 'pbh.ziery.' + uid; }
  let seq = 0;
  function newKey() { return Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 5); }
  function load(uid) {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(key(uid)) || 'null'); } catch (e) { s = null; }
    s = s && typeof s === 'object' ? s : {};
    const out = {
      v: 2, coins: +s.coins || 0, spent: +s.spent || 0, boxes: +s.boxes || 0, subs: +s.subs || 0, views: +s.views || 0,
      videos: +s.videos || 0, rec: s.rec && s.rec.end ? s.rec : null,
      items: Array.isArray(s.items) ? s.items.filter(function (x) { return x && BY_ID[x.id]; }) : null,
      deliveries: Array.isArray(s.deliveries) ? s.deliveries.filter(function (x) { return x && BY_ID[x.id]; }) : [],
      uploads: Array.isArray(s.uploads) ? s.uploads.slice(0, 5) : []
    };
    if (!out.items) {
      /* First visit, or the first version of the game: starter set placed, earlier buys kept in storage. */
      out.items = STARTER.map(function (p) { return { k: newKey(), id: p[0], x: p[1], y: p[2] }; });
      (Array.isArray(s.owned) ? s.owned : []).forEach(function (id) { if (BY_ID[id] && BY_ID[id].price) out.items.push({ k: newKey(), id: id, x: null, y: null }); });
    }
    return out;
  }
  function save(uid, s) { try { localStorage.setItem(key(uid), JSON.stringify(s)); } catch (e) { /* storage off */ } }

  /* ---------- Real habits ---------- */
  const PER_ENTRY = 5, PER_DAY = 10, PER_SAVED = 20, PER_SPLIT = 300, PER_BADGE = 20;
  const BOX_EVERY = 100000, PER_BOX = 80;

  function habits(input) {
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
    const today = input.today || '';
    const splitMonths = Object.keys(months).filter(function (m) {
      const x = months[m];
      return m < today.slice(0, 7) && x.income > 0 && x.needs <= x.income * shares.needs / 100 && x.wants <= x.income * shares.wants / 100 && x.savings >= x.income * shares.savings / 100;
    }).length;
    /* Streak: days in a row with an entry, ending today or yesterday. */
    function shift(d, n) { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
    let streak = 0;
    let k = days[today] ? today : shift(today, -1);
    while (days[k] && streak < 400) { streak++; k = shift(k, -1); }
    const dayCount = Object.keys(days).length;
    const badges = input.badges || 0;
    const boxesReached = Math.floor(saved / BOX_EVERY);
    const opened = Math.min(input.boxes || 0, boxesReached);
    const allowance = [
      ['Entries logged', txs.length, txs.length * PER_ENTRY],
      ['Days you logged', dayCount, dayCount * PER_DAY],
      ['Money saved', saved, Math.floor(saved / (PER_SAVED * 100)), true],
      ['Months on your split', splitMonths, splitMonths * PER_SPLIT],
      ['Badges earned', badges, badges * PER_BADGE],
      ['Delivery boxes opened', opened, opened * PER_BOX]
    ];
    const boosts = [
      ['Logged an entry today', days[today] ? 25 : 0, days[today] ? 'Active' : 'Log one to turn this on'],
      ['Logging streak', Math.min(50, streak * 5), streak + (streak === 1 ? ' day' : ' days') + ' · +5% a day, up to +50%'],
      ['Months on your split', Math.min(30, splitMonths * 10), splitMonths + ' · +10% each, up to +30%']
    ];
    return {
      allowance: allowance, coins: allowance.reduce(function (a, r) { return a + r[2]; }, 0),
      boosts: boosts, boost: boosts.reduce(function (a, b) { return a + b[1]; }, 0),
      saved: saved, boxesWaiting: boxesReached - opened, nextBoxAt: (boxesReached + 1) * BOX_EVERY
    };
  }

  /* ---------- The view ---------- */
  function render(ctx) {
    const h = ctx.h, toast = ctx.toast, user = ctx.user;
    const money = function (cents) { return BT.formatMoney(cents, user.currency); };
    const fmt = function (n) { return Math.floor(Number(n) || 0).toLocaleString('en-PH'); };
    const store = load(user.id);
    save(user.id, store);
    let topic = 'ipon', length = 'regular';
    let selected = null;       /* { k, mode: 'place' | 'item' } */
    let shopFilter = 'shop';
    let truck = false;
    let justPlaced = null;
    let lastUpload = null;

    const hud = h('section', { class: 'zr-hud', 'aria-label': 'Ziery’s channel' });
    const room = h('div', { class: 'zr-room' });
    const roomBar = h('div', { class: 'zr-roombar' });
    const stage = h('section', { class: 'zr-stage', 'aria-label': 'Ziery’s room' }, room, roomBar);
    const studio = h('section', { class: 'zr-card zr-studio', 'aria-labelledby': 'zr-studio-h' });
    const drops = h('section', { class: 'zr-card zr-drops', 'aria-labelledby': 'zr-drops-h' });
    const shop = h('section', { class: 'zr-card zr-shop', 'aria-labelledby': 'zr-shop-h' });
    const real = h('section', { class: 'zr-card zr-earn', 'aria-labelledby': 'zr-earn-h' });
    const ladder = h('section', { class: 'zr-card zr-ladder', 'aria-labelledby': 'zr-ladder-h' });

    function persist() { save(user.id, store); }
    function S() {
      const hb = habits({ txs: BT.listTx(), goals: ctx.goals(), plan: BT.getPlan(), badges: ctx.badges(), today: BT.today(), boxes: store.boxes });
      const level = levelOf(store.subs);
      return { hb: hb, level: level, coins: Math.max(0, hb.coins + store.coins - store.spent) };
    }
    function placed() { return store.items.filter(function (x) { return x.x !== null && x.x !== undefined; }); }
    function owns(id) { return store.items.some(function (x) { return x.id === id; }) || store.deliveries.some(function (d) { return d.id === id; }); }
    function at(x, y) { return placed().find(function (p) { return p.x === x && p.y === y; }); }
    /** Topic boost from the items on display (items in storage don't count). */
    function boostFor(t) {
      const seen = {};
      return placed().reduce(function (a, p) {
        if (seen[p.id]) return a;   /* two of the same item don't stack */
        seen[p.id] = true;
        const b = BY_ID[p.id].boosts;
        return a + (b[t] || 0) + (b.all || 0);
      }, 0);
    }
    function boostText(b) {
      return Object.keys(b).map(function (t) {
        const name = t === 'all' ? 'All vlogs' : TOPICS.find(function (x) { return x[0] === t; })[1];
        return '+' + b[t] + '% ' + name;
      }).join(' · ') || 'Decoration';
    }
    function clock(ms) {
      const s = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(s / 60), r = s % 60;
      return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ':' + String(r).padStart(2, '0');
    }

    /* ---- Channel header ---- */
    function drawHud(s) {
      const t = titleOf(s.level);
      const from = subsFor(s.level), to = subsFor(Math.min(MAX_LEVEL, s.level + 1));
      const pct = s.level >= MAX_LEVEL ? 100 : Math.round((store.subs - from) / Math.max(1, to - from) * 100);
      hud.replaceChildren(
        h('div', { class: 'zr-who' },
          h('span', { class: 'zr-lvl num', 'aria-label': 'Level ' + s.level }, String(s.level)),
          h('div', { class: 'zr-who-text' },
            h('p', { class: 'zr-title' }, t[1]),
            h('div', { class: 'zr-xpbar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': 'Subscribers to next level' }, h('span', { style: 'width:' + pct + '%' })),
            h('p', { class: 'zr-sub num' }, s.level >= MAX_LEVEL ? 'Max level' : fmt(store.subs - from) + ' / ' + fmt(to - from) + ' subscribers to level ' + (s.level + 1)))),
        h('div', { class: 'zr-stats' },
          stat('Subscribers', fmt(store.subs)),
          stat('Views', fmt(store.views)),
          stat('Ipon Coins', '🪙 ' + fmt(s.coins))));
    }
    function stat(k, v) { return h('div', { class: 'zr-stat' }, h('span', { class: 'zr-stat-k' }, k), h('span', { class: 'zr-stat-v num' }, v)); }

    /* ---- Room ---- */
    function drawRoom(s) {
      const tier = s.level >= 20 ? 'dream' : s.level >= 10 ? 'aesthetic' : s.level >= 5 ? 'cozy' : 'bare';
      room.className = 'zr-room zr-' + tier + (selected && selected.mode === 'place' ? ' placing' : '');
      const sel = selected && store.items.find(function (x) { return x.k === selected.k; });
      const nodes = [h('div', { class: 'zr-wall' }), h('div', { class: 'zr-floor' }), h('div', { class: 'zr-window', 'aria-hidden': 'true' }, h('span'), h('span'))];
      placed().forEach(function (p) {
        const it = BY_ID[p.id];
        const cls = 'zr-item' + (justPlaced === p.k ? ' zr-pop' : '') + (selected && selected.k === p.k ? ' sel' : '');
        nodes.push(h('button', {
          type: 'button', class: cls, title: it.name, 'aria-label': it.name + ', tap to move or store',
          style: 'left:' + ((p.x + 0.5) * 100 / COLS) + '%;top:' + ((p.y + 1) * 100 / ROWS) + '%;--s:' + it.size + ';z-index:' + (10 + p.y),
          onclick: function () {
            if (selected && selected.mode === 'place') return;
            selected = selected && selected.k === p.k ? null : { k: p.k, mode: 'item' };
            draw();
          }
        }, it.emoji));
      });
      /* While placing, every free tile in the right zone is a target. */
      if (sel && selected.mode === 'place') {
        const zone = BY_ID[sel.id].zone;
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            const inZone = zone === 'wall' ? y < WALL_ROWS : y >= WALL_ROWS;
            if (!inZone || at(x, y) || (y < WALL_ROWS && x >= 4 && x <= 5)) continue;   /* the window stays clear */
            nodes.push(h('button', {
              type: 'button', class: 'zr-tile', 'aria-label': 'Place here, row ' + (y + 1) + ', column ' + (x + 1),
              style: 'left:' + (x * 100 / COLS) + '%;top:' + (y * 100 / ROWS) + '%;width:' + (100 / COLS) + '%;height:' + (100 / ROWS) + '%',
              onclick: function () { sel.x = x; sel.y = y; justPlaced = sel.k; selected = null; persist(); draw(); }
            }));
          }
        }
      }
      const desk = placed().some(function (p) { return p.id === 'laptop' || p.id === 'monitor'; });
      nodes.push(h('span', { class: 'zr-ziery' + (store.rec ? ' recording' : ''), 'aria-hidden': 'true' }, store.rec ? '🧑‍💻' : desk ? '🧑‍💻' : '🧍'));
      if (store.rec) nodes.push(h('span', { class: 'zr-rec-dot' }, 'REC'));
      if (truck) nodes.push(h('div', { class: 'zr-truck', 'aria-hidden': 'true' }, h('span', { class: 'zr-truck-box' }, '📦'), '🚚'));
      room.replaceChildren.apply(room, nodes);
      room.setAttribute('aria-label', 'Ziery’s room: ' + placed().map(function (p) { return BY_ID[p.id].name; }).join(', '));
      justPlaced = null;

      /* The bar under the room: what you're placing, what you tapped, or what's in storage. */
      const stored = store.items.filter(function (x) { return x.x === null || x.x === undefined; });
      if (sel && selected.mode === 'place') {
        roomBar.replaceChildren(h('p', { class: 'zr-hint' }, 'Tap a highlighted ' + (BY_ID[sel.id].zone === 'wall' ? 'spot on the wall' : 'spot on the floor') + ' for ' + BY_ID[sel.id].emoji + ' ' + BY_ID[sel.id].name + '.'),
          h('button', { type: 'button', class: 'btn', onclick: function () { selected = null; draw(); } }, 'Cancel'));
      } else if (sel) {
        const it = BY_ID[sel.id];
        roomBar.replaceChildren(h('p', { class: 'zr-hint' }, h('strong', null, it.emoji + ' ' + it.name), ' · ' + boostText(it.boosts)),
          h('span', { class: 'zr-bar-actions' },
            h('button', { type: 'button', class: 'btn', onclick: function () { selected = { k: sel.k, mode: 'place' }; draw(); } }, 'Move'),
            h('button', { type: 'button', class: 'btn', onclick: function () { sel.x = null; sel.y = null; selected = null; persist(); draw(); } }, 'Store'),
            h('button', { type: 'button', class: 'btn', onclick: function () { selected = null; draw(); } }, 'Done')));
      } else if (stored.length) {
        roomBar.replaceChildren(h('p', { class: 'zr-hint' }, 'In storage · tap to place'),
          h('span', { class: 'zr-bar-actions zr-storage' }, stored.map(function (x) {
            return h('button', { type: 'button', class: 'zr-chip', title: BY_ID[x.id].name, onclick: function () { selected = { k: x.k, mode: 'place' }; draw(); } }, BY_ID[x.id].emoji + ' ' + BY_ID[x.id].name);
          })));
      } else {
        roomBar.replaceChildren(h('p', { class: 'zr-hint' }, 'Tap an item to move it or put it in storage. Items in the room boost your vlogs.'));
      }
    }

    /* ---- Studio: record and upload vlogs ---- */
    function viewsFor(s, t, len) {
      const L = LENGTHS.find(function (x) { return x[0] === len; });
      const trend = trending(Date.now()).ids.indexOf(t) !== -1;
      const mult = (1 + boostFor(t) / 100) * (1 + s.hb.boost / 100) * (trend ? 2 : 1);
      return Math.round((60 + 40 * s.level) * L[3] * mult);
    }
    function drawStudio(s) {
      const now = Date.now();
      const tr = trending(now);
      const head = h('div', { class: 'zr-card-head' }, h('h2', { id: 'zr-studio-h' }, 'Studio'),
        h('span', { class: 'small muted num' }, '🔥 Trending changes in ' + clock(tr.until - now)));
      if (store.rec) {
        const r = store.rec;
        const T = TOPICS.find(function (x) { return x[0] === r.topic; });
        const left = r.end - now;
        const pct = Math.min(100, Math.round((now - r.start) / (r.end - r.start) * 100));
        studio.replaceChildren(head,
          h('div', { class: 'zr-recording' },
            h('span', { class: 'zr-rec-emoji', 'aria-hidden': 'true' }, T[2]),
            h('div', { class: 'zr-rec-main' },
              h('p', { class: 'zr-rec-t' }, left > 0 ? 'Recording: ' + T[1] : 'Ready to upload: ' + T[1]),
              h('span', { class: 'zr-mini' }, h('span', { style: 'width:' + pct + '%' })),
              h('p', { class: 'small muted num' }, left > 0 ? clock(left) + ' left' : 'About ' + fmt(viewsFor(s, r.topic, r.len)) + ' views expected')),
            left > 0 ? h('button', { type: 'button', class: 'btn', onclick: function () { store.rec = null; persist(); draw(); } }, 'Cancel')
              : h('button', { type: 'button', class: 'btn primary', onclick: upload }, 'Upload')),
          lastUpload);
        return;
      }
      studio.replaceChildren(head,
        h('p', { class: 'zr-label' }, 'Topic'),
        h('div', { class: 'zr-topics', role: 'radiogroup', 'aria-label': 'Vlog topic' }, TOPICS.map(function (t) {
          const hot = tr.ids.indexOf(t[0]) !== -1;
          const b = boostFor(t[0]);
          return h('button', { type: 'button', role: 'radio', class: 'zr-topic' + (hot ? ' hot' : ''), 'aria-checked': topic === t[0] ? 'true' : 'false',
            onclick: function () { topic = t[0]; drawStudio(S()); } },
            h('span', { class: 'zr-topic-e', 'aria-hidden': 'true' }, t[2]),
            h('span', { class: 'zr-topic-n' }, t[1]),
            h('span', { class: 'zr-topic-b num' }, (hot ? '🔥 ×2 · ' : '') + '+' + b + '%'));
        })),
        h('p', { class: 'zr-label' }, 'Length'),
        h('div', { class: 'zr-seg zr-lengths', role: 'radiogroup', 'aria-label': 'Vlog length' }, LENGTHS.map(function (l) {
          return h('button', { type: 'button', role: 'radio', 'aria-checked': length === l[0] ? 'true' : 'false', 'aria-pressed': length === l[0] ? 'true' : 'false',
            onclick: function () { length = l[0]; drawStudio(S()); } }, l[1] + ' · ' + clock(l[2] * 1000));
        })),
        h('div', { class: 'zr-go' },
          h('p', { class: 'small muted num' }, 'About ' + fmt(viewsFor(s, topic, length)) + ' views'
            + (s.hb.boost ? ' · real-life boost +' + s.hb.boost + '%' : '')),
          h('button', { type: 'button', class: 'btn primary', onclick: record }, '● Record')),
        lastUpload);
    }
    function record() {
      const L = LENGTHS.find(function (x) { return x[0] === length; });
      const now = Date.now();
      store.rec = { topic: topic, len: length, start: now, end: now + L[2] * 1000 };
      persist(); draw();
    }
    function upload() {
      const r = store.rec;
      if (!r || Date.now() < r.end) return;
      const before = S();
      const views = viewsFor(before, r.topic, r.len);
      const subs = Math.max(1, Math.round(views / 8));
      const coins = Math.round(views / 5);
      store.views += views; store.subs += subs; store.coins += coins; store.videos += 1;
      store.uploads.unshift({ topic: r.topic, views: views, at: Date.now() });
      store.uploads = store.uploads.slice(0, 5);
      store.rec = null;
      persist();
      const after = S();
      const T = TOPICS.find(function (x) { return x[0] === r.topic; });
      lastUpload = h('p', { class: 'zr-result num' }, T[2] + ' Uploaded! +' + fmt(views) + ' views · +' + fmt(subs) + ' subscribers · +🪙 ' + fmt(coins));
      if (after.level > before.level) {
        if (window.PBH_FX) PBH_FX.celebrate();
        toast('🎉 Level ' + after.level + '! ' + titleOf(after.level)[1] + '. New items in the shop.');
      }
      draw();
    }

    /* ---- Deliveries and savings boxes ---- */
    function drawDrops(s) {
      const now = Date.now();
      const rows = store.deliveries.map(function (d) {
        const it = BY_ID[d.id];
        const left = d.at - now;
        return h('li', { class: 'zr-drop' },
          h('span', { class: 'zr-row-emoji', 'aria-hidden': 'true' }, left > 0 ? '🚚' : '📦'),
          h('div', { class: 'zr-row-main' }, h('span', { class: 'zr-row-name' }, it.name),
            h('span', { class: 'small muted num' }, left > 0 ? 'Arrives in ' + clock(left) : 'Delivered!')),
          left > 0 ? h('span', { class: 'zr-tag num' }, clock(left))
            : h('button', { type: 'button', class: 'btn primary', onclick: function () { unbox(d); } }, 'Unbox'));
      });
      if (s.hb.boxesWaiting > 0) {
        rows.unshift(h('li', { class: 'zr-drop' },
          h('span', { class: 'zr-row-emoji', 'aria-hidden': 'true' }, '🎁'),
          h('div', { class: 'zr-row-main' }, h('span', { class: 'zr-row-name' }, s.hb.boxesWaiting === 1 ? 'Savings box' : s.hb.boxesWaiting + ' savings boxes'),
            h('span', { class: 'small muted' }, 'One for every ' + money(BOX_EVERY) + ' you’ve saved in real life.')),
          h('button', { type: 'button', class: 'btn primary', onclick: openBox }, 'Open')));
      }
      const left = s.hb.nextBoxAt - s.hb.saved;
      drops.replaceChildren(
        h('div', { class: 'zr-card-head' }, h('h2', { id: 'zr-drops-h' }, 'Deliveries')),
        rows.length ? h('ul', { class: 'zr-items' }, rows) : h('p', { class: 'small muted' }, 'Nothing on the way. Buy something from the shop.'),
        h('p', { class: 'zr-next small muted num' }, '🎁 Next savings box: save ' + money(left) + ' more in real life.'));
    }
    function unbox(d) {
      store.deliveries = store.deliveries.filter(function (x) { return x !== d; });
      const item = { k: newKey(), id: d.id, x: null, y: null };
      store.items.push(item);
      persist();
      truck = true;
      draw();
      stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () {
        truck = false;
        if (window.PBH_FX) PBH_FX.celebrate();
        toast('📦 ' + BY_ID[d.id].name + ' unboxed! Tap a spot in the room to place it.');
        selected = { k: item.k, mode: 'place' };
        if (room.isConnected) draw();
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 2200);
    }
    function openBox() {
      store.boxes += 1;
      persist();
      if (window.PBH_FX) PBH_FX.celebrate();
      toast('🎁 +' + PER_BOX + ' Ipon Coins!');
      draw();
    }

    /* ---- Shop ---- */
    function drawShop(s) {
      const filters = [['shop', 'Shop'], ['owned', 'Owned'], ['all', 'All']];
      const list = ITEMS.filter(function (i) {
        if (shopFilter === 'shop') return i.price > 0 && !owns(i.id);
        if (shopFilter === 'owned') return owns(i.id);
        return true;
      });
      shop.replaceChildren(
        h('div', { class: 'zr-card-head' }, h('h2', { id: 'zr-shop-h' }, 'Wishlist shop'),
          h('div', { class: 'zr-seg', role: 'group', 'aria-label': 'Show items' }, filters.map(function (f) {
            return h('button', { type: 'button', 'aria-pressed': shopFilter === f[0] ? 'true' : 'false', onclick: function () { shopFilter = f[0]; drawShop(S()); } }, f[1]);
          }))),
        list.length ? h('ul', { class: 'zr-items' }, list.map(function (i) {
          const own = owns(i.id);
          const locked = !own && s.level < i.level;
          const enough = s.coins >= i.price;
          const pct = own ? 100 : Math.min(100, Math.round(s.coins / Math.max(1, i.price) * 100));
          let action;
          if (own) action = h('span', { class: 'zr-tag good' }, i.price ? 'Owned' : 'Starter');
          else if (locked) action = h('span', { class: 'zr-tag' }, 'Level ' + i.level);
          else action = h('button', { type: 'button', class: 'btn' + (enough ? ' primary' : ''), disabled: !enough, onclick: function () { buy(i); } }, enough ? 'Buy' : 'Save up');
          return h('li', { class: 'zr-row' + (locked ? ' locked' : '') + (own ? ' owned' : '') },
            h('span', { class: 'zr-row-emoji', 'aria-hidden': 'true' }, i.emoji),
            h('div', { class: 'zr-row-main' },
              h('div', { class: 'zr-row-top' }, h('span', { class: 'zr-row-name' }, i.name), i.price ? h('span', { class: 'zr-row-price num' }, '🪙 ' + fmt(i.price)) : null),
              h('p', { class: 'zr-row-note small' }, boostText(i.boosts) + (i.mins ? ' · 🚚 ' + i.mins + ' min' : '')),
              h('p', { class: 'zr-row-note small muted' }, i.note),
              !own && !locked ? h('span', { class: 'zr-mini' }, h('span', { style: 'width:' + pct + '%' })) : null),
            action);
        })) : h('p', { class: 'zr-empty small muted' }, shopFilter === 'shop' ? 'You own everything. Financial independence unlocked!' : 'Nothing here yet.'));
    }
    function buy(item) {
      const s = S();
      if (owns(item.id) || s.level < item.level || s.coins < item.price) return;
      store.spent += item.price;
      store.deliveries.push({ id: item.id, at: Date.now() + item.mins * 60000 });
      persist();
      toast('🛒 ' + item.name + ' ordered. The truck arrives in ' + item.mins + (item.mins === 1 ? ' minute.' : ' minutes.'));
      draw();
      drops.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ---- Real-life boosts ---- */
    function drawReal(s) {
      real.replaceChildren(
        h('div', { class: 'zr-card-head' }, h('h2', { id: 'zr-earn-h' }, 'Real-life boosts')),
        h('p', { class: 'small muted' }, 'Your real money habits make Ziery’s channel grow faster.'),
        h('ul', { class: 'zr-boosts' }, s.hb.boosts.map(function (b) {
          return h('li', { class: b[1] ? 'on' : '' }, h('span', null, h('strong', null, b[0]), h('span', { class: 'small muted' }, b[2])), h('span', { class: 'num zr-boost-v' }, '+' + b[1] + '%'));
        })),
        h('table', { class: 'zr-table' },
          h('thead', null, h('tr', null, h('th', null, 'Habit allowance'), h('th', { class: 'r' }, 'Coins'))),
          h('tbody', null, s.hb.allowance.map(function (r) {
            return h('tr', null, h('td', null, r[0], h('span', { class: 'zr-count num' }, r[3] ? money(r[1]) : fmt(r[1]))), h('td', { class: 'r num' }, fmt(r[2])));
          })),
          h('tfoot', null, h('tr', null, h('td', null, 'From your habits'), h('td', { class: 'r num' }, fmt(s.hb.coins))))),
        h('div', { class: 'zr-actions' }, h('a', { class: 'btn', href: '#budget-plan' }, 'Log an entry')));
    }

    function drawLadder(s) {
      ladder.replaceChildren(
        h('div', { class: 'zr-card-head' }, h('h2', { id: 'zr-ladder-h' }, 'Levels')),
        h('ol', { class: 'zr-steps' }, TITLES.slice().reverse().map(function (t) {
          return h('li', { class: s.level >= t[0] ? 'done' : '' },
            h('span', { class: 'zr-step-n num' }, String(t[0])),
            h('div', null, h('p', { class: 'zr-step-t' }, t[1]), h('p', { class: 'small muted' }, t[2] + ' · ' + fmt(subsFor(t[0])) + ' subscribers')));
        })));
    }

    function draw() {
      const s = S();
      drawHud(s); drawRoom(s); drawStudio(s); drawDrops(s); drawShop(s); drawReal(s); drawLadder(s);
    }
    /* Timers tick once a second: recording, trending and deliveries. */
    const tick = setInterval(function () {
      if (!room.isConnected) return;
      const s = S();
      drawStudio(s);
      if (store.deliveries.length || s.hb.boxesWaiting) drawDrops(s);
    }, 1000);

    const page = h('div', { class: 'wide games zr' },
      h('p', { class: 'bd-kicker' }, 'Games'),
      h('h1', null, 'Ziery Simulator'),
      h('p', { class: 'muted bd-lead' }, 'Record vlogs, grow Ziery’s channel and turn a bare room into a dream room. Uploads earn views, subscribers and Ipon Coins; items in the room boost your vlogs. Your real money habits boost everything. Saved on this device.'),
      hud,
      h('div', { class: 'zr-main' },
        h('div', { class: 'zr-left' }, stage, studio, real),
        h('div', { class: 'zr-right' }, drops, shop, ladder)));
    draw();
    return { el: page, refresh: draw, stop: function () { clearInterval(tick); } };
  }

  return { render: render, ITEMS: ITEMS, TOPICS: TOPICS, levelOf: levelOf, subsFor: subsFor, habits: habits, trending: trending };
})();
