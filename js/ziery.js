/* Games › Ziery Simulator: a pixel-art room-and-vlog creator game.
   Ziery records vlogs on money topics. Uploads earn Views, Subscribers and Ipon Coins.
   Coins buy room items; each item boosts some vlog topics, arrives by delivery truck after
   a real-time wait, and is placed in the isometric room (floor, wall, or on a table).
   Subscribers raise Ziery's level. Real money habits boost every upload and pay a coin
   allowance. Everything is kept on this device. Uses window.BT. No Firebase code here. */
window.ZIERY = (function () {
  'use strict';

  /* ---------- Levels (by subscribers) ---------- */
  const MAX_LEVEL = 20;
  function subsFor(level) { return level <= 1 ? 0 : Math.round(50 * Math.pow(level - 1, 2.2)); }
  function levelOf(subs) { let l = 1; while (l < MAX_LEVEL && subs >= subsFor(l + 1)) l++; return l; }
  const TITLES = [
    [20, 'Financial Independence Ziery', 'Fully furnished, a mini vault, every wishlist item checked.'],
    [10, 'Budget Master Ziery', 'Ergonomic chair, dual monitor and a smart savings jar.'],
    [5, 'Kinsenas Survivor Ziery', 'A real setup and a plastic alkansya. Payday to payday, still uploading.'],
    [1, 'Petsa de Peligro Ziery', 'A karton for a desk, kape 3-in-1 and an old electric fan.']
  ];
  function titleOf(level) { return TITLES.find(function (t) { return level >= t[0]; }); }

  /* ---------- Vlog topics and lengths ---------- */
  const TOPICS = [
    ['ipon', 'Ipon tips', '🐷'], ['budget', 'Budget vlog', '📊'], ['food', 'Food trip', '🍜'],
    ['tech', 'Tech review', '💻'], ['travel', 'Travel', '🧳'], ['gaming', 'Gaming', '🎮']
  ];
  const LENGTHS = [['short', 'Short', 30, 1], ['regular', 'Regular', 120, 2.6], ['long', 'Long', 300, 5.5]];
  function trending(now) {
    const block = Math.floor(now / 7200000);
    const a = (block * 7 + 3) % TOPICS.length;
    let b = (block * 5 + 1) % TOPICS.length;
    if (b === a) b = (b + 1) % TOPICS.length;
    return { ids: [TOPICS[a][0], TOPICS[b][0]], until: (block + 1) * 7200000 };
  }

  /* ---------- Items ----------
     zone: floor (a floor tile), wall (a wall slot) or top (on a table).
     block: drawn as a pixel box [height, top, left, right]; surface: other items can sit on it. */
  const ITEMS = [
    ['karton', 'Karton na mesa', '📦', 1, 0, 0, 'floor', {}, 'A cardboard box desk. It works!', { block: [15, '#d9a066', '#b97a45', '#9c6234'], surface: true }],
    ['tokador', 'Lumang tokador', '🗄️', 1, 0, 0, 'floor', { ipon: 5 }, 'Hand-me-down drawers.', { block: [20, '#8f6a8f', '#6f4f70', '#5a3f5b'], surface: true }],
    ['banig', 'Banig', '🟫', 1, 0, 0, 'floor', {}, 'Where Ziery sleeps for now.', { mat: true }],
    ['fan', 'Lumang electric fan', '🪭', 1, 0, 0, 'floor', { all: 2 }, 'Squeaks on level 2.'],
    ['kape', 'Kape 3-in-1', '☕', 1, 0, 0, 'top', { budget: 5 }, 'Breakfast of champions.'],
    ['alkansya', 'Plastic na alkansya', '🐷', 1, 120, 1, 'top', { ipon: 15 }, 'Every coin counts.'],
    ['calculator', 'Calculator', '🧮', 1, 150, 1, 'top', { budget: 15 }, 'For the monthly math.'],
    ['upuan', 'Monobloc chair', '🪑', 2, 120, 1, 'floor', { all: 3 }, 'The classic.'],
    ['halaman', 'Halaman', '🪴', 2, 100, 1, 'floor', { all: 3 }, 'A little green on camera.'],
    ['ricecooker', 'Rice cooker', '🍚', 2, 250, 2, 'top', { food: 15 }, 'Baon season.'],
    ['ringlight', 'Ring light', '💡', 3, 300, 3, 'floor', { all: 6 }, 'Good lighting, more views.'],
    ['calendar', 'Kalendaryo', '🗓️', 3, 200, 2, 'wall', { budget: 10 }, 'Payday circled in red.'],
    ['laptop', 'Laptop', '💻', 4, 900, 5, 'top', { tech: 20, budget: 10 }, 'Edit, upload and budget on it.'],
    ['camera', 'Camera', '📷', 4, 700, 5, 'top', { all: 10 }, 'Sharper vlogs.'],
    ['mic', 'Microphone', '🎙️', 5, 600, 4, 'top', { all: 8 }, 'No more echo.'],
    ['sapatos', 'Bagong sapatos', '👟', 5, 400, 3, 'floor', { travel: 12 }, 'Paid in cash, not utang.'],
    ['books', 'Money books', '📚', 5, 300, 3, 'top', { budget: 10, ipon: 10 }, 'Read, then vlog about it.'],
    ['mesa', 'Wooden desk', '🪵', 6, 700, 6, 'floor', { all: 5 }, 'Goodbye, karton.', { block: [16, '#a8794f', '#7f5735', '#6a4629'], surface: true }],
    ['headphones', 'Headphones', '🎧', 6, 350, 4, 'top', { gaming: 12 }, 'Focus mode on.'],
    ['kama', 'Kama', '🛏️', 6, 800, 8, 'floor', { all: 5 }, 'Goodbye, banig.', { bed: true }],
    ['map', 'World map', '🗺️', 6, 400, 4, 'wall', { travel: 15 }, 'Pins on the next trip.'],
    ['keyboard', 'Mechanical keyboard', '⌨️', 7, 600, 6, 'top', { tech: 15, gaming: 10 }, 'Clicky. Worth every peso saved.'],
    ['aircon', 'Aircon', '❄️', 7, 1200, 10, 'wall', { all: 8 }, 'No more pawis on camera.'],
    ['clock', 'Wall clock', '⏰', 8, 300, 4, 'wall', { budget: 8 }, 'Upload on schedule.'],
    ['ergochair', 'Ergonomic chair', '💺', 8, 1000, 10, 'floor', { all: 6 }, 'Your back says thank you.'],
    ['monitor', 'Dual monitor', '🖥️', 9, 1500, 12, 'top', { tech: 20, gaming: 15 }, 'Two screens, twice the edits.'],
    ['jar', 'Smart savings jar', '🫙', 9, 700, 8, 'top', { ipon: 25 }, 'Counts every deposit.'],
    ['frame', 'Framed goal', '🖼️', 10, 250, 4, 'wall', { travel: 10, ipon: 5 }, 'A picture of the dream.'],
    ['speaker', 'Speaker', '🔊', 10, 500, 6, 'floor', { gaming: 8, food: 5 }, 'Payday playlist.'],
    ['guitar', 'Gitara', '🎸', 11, 900, 10, 'floor', { all: 5 }, 'Intro music, homemade.'],
    ['tv', 'Smart TV', '📺', 12, 1400, 15, 'floor', { gaming: 15, food: 10 }, 'Paid in full.'],
    ['award', '100K Ipon Award', '🏅', 12, 800, 8, 'wall', { all: 10 }, 'Ziery’s own milestone plaque.'],
    ['controller', 'Gaming rig', '🎮', 13, 1800, 15, 'top', { gaming: 25 }, 'The full setup.'],
    ['luggage', 'Pondo sa bakasyon', '🧳', 14, 2500, 20, 'floor', { travel: 25 }, 'The trip is funded.'],
    ['lights', 'Fairy lights', '✨', 15, 600, 6, 'wall', { all: 6 }, 'Dream room vibes.'],
    ['vault', 'Mini vault', '🔐', 17, 3000, 25, 'floor', { ipon: 40 }, 'The savings vault.'],
    ['trophy', 'FI trophy', '🏆', 20, 5000, 30, 'top', { all: 15 }, 'Financial independence.']
  ].map(function (r) {
    return Object.assign({ id: r[0], name: r[1], emoji: r[2], level: r[3], price: r[4], mins: r[5], zone: r[6], boosts: r[7], note: r[8] }, r[9] || {});
  });
  const BY_ID = {};
  ITEMS.forEach(function (i) { BY_ID[i.id] = i; });

  /* ---------- Room geometry (logical pixels; the canvas is scaled up, pixel-perfect) ---------- */
  const N = 6;                 /* 6 × 6 floor tiles */
  const TW = 16, TH = 8;       /* half a tile's width and height */
  const W = 256, H = 232, OX = 128, OY = 100, WALL = 80;
  function cell(x, y) { return { x: OX + (x - y) * TW, y: OY + (x + y) * TH + TH }; }   /* centre of a tile */
  function wallSpot(side, i) {
    return side === 'L' ? { x: OX - (i + 0.5) * TW, y: OY + (i + 0.5) * TH - 42 } : { x: OX + (i + 0.5) * TW, y: OY + (i + 0.5) * TH - 42 };
  }
  const WINDOW_SLOTS = { R3: true, R4: true };

  /* ---------- Saved on this device ---------- */
  function key(uid) { return 'pbh.ziery.' + uid; }
  let seq = 0;
  function newKey() { return Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 5); }
  function starterItems() {
    const desk = newKey();
    return [
      { k: desk, id: 'karton', at: { t: 'floor', x: 2, y: 2 } },
      { k: newKey(), id: 'tokador', at: { t: 'floor', x: 0, y: 0 } },
      { k: newKey(), id: 'banig', at: { t: 'floor', x: 0, y: 4 } },
      { k: newKey(), id: 'fan', at: { t: 'floor', x: 5, y: 0 } },
      { k: newKey(), id: 'kape', at: { t: 'top', on: desk, s: 1 } }
    ];
  }
  function load(uid) {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(key(uid)) || 'null'); } catch (e) { s = null; }
    s = s && typeof s === 'object' ? s : {};
    const out = {
      v: 3, coins: +s.coins || 0, spent: +s.spent || 0, boxes: +s.boxes || 0, subs: +s.subs || 0, views: +s.views || 0,
      videos: +s.videos || 0, rec: s.rec && s.rec.end ? s.rec : null,
      deliveries: Array.isArray(s.deliveries) ? s.deliveries.filter(function (x) { return x && BY_ID[x.id]; }) : [],
      uploads: Array.isArray(s.uploads) ? s.uploads.slice(0, 5) : [],
      items: null
    };
    if (s.v === 3 && Array.isArray(s.items)) out.items = s.items.filter(function (x) { return x && BY_ID[x.id]; });
    else {
      /* New game, or an earlier version: starter room, everything bought earlier goes to storage. */
      out.items = starterItems();
      const bought = (Array.isArray(s.items) ? s.items.map(function (x) { return x && x.id; }) : []).concat(Array.isArray(s.owned) ? s.owned : []);
      const seen = {};
      bought.forEach(function (id) { if (id && BY_ID[id] && BY_ID[id].price && !seen[id]) { seen[id] = true; out.items.push({ k: newKey(), id: id, at: null }); } });
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
      ['Savings boxes opened', opened, opened * PER_BOX]
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

  /* ---------- Pixel sprites ---------- */
  const ZIERY = [
    '....HHHHH....',
    '...HHHHHHH...',
    '..HHHHHHHHH..',
    '..HHSSSSSHH..',
    '..HSSSSSSSH..',
    '..SSWKSWKSS..',
    '..SSSSSSSSS..',
    '...SSSMMSS...',
    '....SSSSS....',
    '..TTTTTTTTT..',
    '.TTTTLTTTTTT.',
    '.TTTTTTTTTTT.',
    'SSTTTTTTTTTSS',
    'SS.TTTTTTT.SS',
    '...PPPPPPP...',
    '...PP...PP...',
    '...PP...PP...',
    '...BB...BB...'
  ];
  const ZPAL = { H: '#2a2233', S: '#c98a5e', W: '#ffffff', K: '#1d1b26', M: '#8a3b2e', T: '#4fb9d6', L: '#e8e9f3', P: '#33395a', B: '#17161d' };
  function sprite(ctx, rows, pal, x, y, blink) {
    rows.forEach(function (row, j) {
      for (let i = 0; i < row.length; i++) {
        let c = row[i];
        if (c === '.') continue;
        if (blink && (c === 'W' || c === 'K')) c = 'S';
        ctx.fillStyle = pal[c];
        ctx.fillRect(x + i, y + j, 1, 1);
      }
    });
  }

  /* ---------- The view ---------- */
  function render(ctx) {
    const h = ctx.h, toast = ctx.toast, user = ctx.user;
    const money = function (cents) { return BT.formatMoney(cents, user.currency); };
    const fmt = function (n) { return Math.floor(Number(n) || 0).toLocaleString('en-PH'); };
    const store = load(user.id);
    save(user.id, store);
    let topic = 'ipon', length = 'regular';
    let placing = null;       /* key of the item being placed */
    let picked = null;        /* key of the item tapped in the room */
    let panel = null;         /* open panel name */
    let shopFilter = 'shop';
    let truckAt = 0;          /* when the delivery truck animation started */
    let popKey = null, popAt = 0;
    let hits = [];            /* tap targets drawn this frame */
    let lastUpload = null;

    /* Pixel font for the game screen only. */
    if (!document.getElementById('zr-font')) {
      document.head.appendChild(h('link', { id: 'zr-font', rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&display=swap' }));
    }

    function persist() { save(user.id, store); }
    function S() {
      const hb = habits({ txs: BT.listTx(), goals: ctx.goals(), plan: BT.getPlan(), badges: ctx.badges(), today: BT.today(), boxes: store.boxes });
      return { hb: hb, level: levelOf(store.subs), coins: Math.max(0, hb.coins + store.coins - store.spent) };
    }
    function byKey(k) { return store.items.find(function (x) { return x.k === k; }); }
    function isPlaced(x) {
      if (!x.at) return false;
      if (x.at.t === 'top') { const base = byKey(x.at.on); return !!(base && base.at && base.at.t === 'floor'); }
      return true;
    }
    function placed() { return store.items.filter(isPlaced); }
    function stored() { return store.items.filter(function (x) { return !isPlaced(x); }); }
    function owns(id) { return store.items.some(function (x) { return x.id === id; }) || store.deliveries.some(function (d) { return d.id === id; }); }
    function floorAt(x, y) { return placed().find(function (p) { return p.at.t === 'floor' && p.at.x === x && p.at.y === y; }); }
    function wallAt(side, i) { return placed().find(function (p) { return p.at.t === 'wall' && p.at.side === side && p.at.i === i; }); }
    function topAt(k, s) { return placed().find(function (p) { return p.at.t === 'top' && p.at.on === k && p.at.s === s; }); }
    function boostFor(t) {
      const seen = {};
      return placed().reduce(function (a, p) {
        if (seen[p.id]) return a;
        seen[p.id] = true;
        const b = BY_ID[p.id].boosts;
        return a + (b[t] || 0) + (b.all || 0);
      }, 0);
    }
    function boostText(b) {
      return Object.keys(b).map(function (t) {
        const name = t === 'all' ? 'all vlogs' : TOPICS.find(function (x) { return x[0] === t; })[1];
        return '+' + b[t] + '% ' + name;
      }).join(' · ') || 'Decoration';
    }
    function clock(ms) {
      const s = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(s / 60), r = s % 60;
      return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ':' + String(r).padStart(2, '0');
    }
    function viewsFor(s, t, len) {
      const L = LENGTHS.find(function (x) { return x[0] === len; });
      const trend = trending(Date.now()).ids.indexOf(t) !== -1;
      const mult = (1 + boostFor(t) / 100) * (1 + s.hb.boost / 100) * (trend ? 2 : 1);
      return Math.round((60 + 40 * s.level) * L[3] * mult);
    }

    /* ================= Screen ================= */
    const canvas = h('canvas', { class: 'zg-canvas', width: W, height: H, role: 'img', 'aria-label': 'Ziery’s room' });
    const g = canvas.getContext('2d');
    const hudCoins = h('button', { type: 'button', class: 'zg-coins', 'aria-label': 'Ipon Coins. Open habits', onclick: function () { open('habits'); } });
    const hudStats = h('div', { class: 'zg-stats' });
    const hudMe = h('button', { type: 'button', class: 'zg-me', 'aria-label': 'Ziery’s level', onclick: function () { open('levels'); } });
    const face = h('canvas', { class: 'zg-face', width: 13, height: 10 });
    const truckBtn = h('button', { type: 'button', class: 'zg-truck', 'aria-label': 'Deliveries', onclick: function () { open('drops'); } });
    const boxBtn = h('button', { type: 'button', class: 'zg-ic zg-ic-box', title: 'Storage', 'aria-label': 'Storage', onclick: function () { open('storage'); } });
    const banner = h('div', { class: 'zg-banner' });
    const hint = h('div', { class: 'zg-hint', 'aria-live': 'polite' });
    const sheet = h('div', { class: 'zg-sheet', hidden: true, role: 'dialog', 'aria-modal': 'false' });
    const roomBox = h('div', { class: 'zg-roombox' }, canvas, hint);

    const screen = h('div', { class: 'zg' },
      h('div', { class: 'zg-top' }, hudCoins, hudStats, hudMe),
      h('div', { class: 'zg-icons' },
        h('button', { type: 'button', class: 'zg-ic zg-ic-menu', title: 'How to play', 'aria-label': 'How to play', onclick: function () { open('help'); } }, h('i'), h('i'), h('i')),
        boxBtn,
        h('button', { type: 'button', class: 'zg-ic zg-ic-trend', title: 'Trending', 'aria-label': 'Trending topics', onclick: function () { open('studio'); } }, '🔥'),
        h('button', { type: 'button', class: 'zg-ic zg-ic-trophy', title: 'Levels', 'aria-label': 'Levels', onclick: function () { open('levels'); } }, '🏆'),
        h('span', { class: 'zg-grow' }),
        truckBtn),
      roomBox,
      banner,
      h('nav', { class: 'zg-nav', 'aria-label': 'Game' },
        navBtn('studio', 'Studio', '🖥️', 'c1'),
        navBtn('habits', 'Habits', '🧠', 'c2'),
        navBtn('shop', 'Shop', '🏪', 'c3'),
        navBtn('levels', 'Levels', '🏆', 'c4'),
        navBtn('storage', 'Room', '🛋️', 'c5')),
      sheet);
    function navBtn(name, label, emoji, cls) {
      return h('button', { type: 'button', class: 'zg-nb ' + cls, 'data-p': name, onclick: function () { open(panel === name ? null : name); } },
        h('span', { class: 'zg-nb-e', 'aria-hidden': 'true' }, emoji), h('span', { class: 'zg-nb-l' }, label));
    }

    /* ---------- HUD ---------- */
    function drawHud(s) {
      hudCoins.replaceChildren(h('span', { class: 'zg-coin-ic', 'aria-hidden': 'true' }, '🪙', h('b', null, '+')), h('span', { class: 'zg-coin-n' }, fmt(s.coins)));
      hudStats.replaceChildren(
        h('div', { class: 'zg-stat' }, h('span', { class: 'zg-stat-ic', 'aria-hidden': 'true' }, '👁️'), h('span', { title: 'Views' }, fmt(store.views))),
        h('div', { class: 'zg-stat' }, h('span', { class: 'zg-stat-ic', 'aria-hidden': 'true' }, '👥'), h('span', { title: 'Subscribers' }, fmt(store.subs))));
      const fc = face.getContext('2d');
      fc.clearRect(0, 0, 13, 10);
      sprite(fc, ZIERY.slice(0, 10), ZPAL, 0, 0, false);
      const from = subsFor(s.level), to = subsFor(Math.min(MAX_LEVEL, s.level + 1));
      const pct = s.level >= MAX_LEVEL ? 100 : Math.round((store.subs - from) / Math.max(1, to - from) * 100);
      hudMe.replaceChildren(face, h('span', { class: 'zg-lv' }, String(s.level)), h('i', { class: 'zg-lvbar', style: 'width:' + pct + '%' }));
      const waiting = store.deliveries.length + s.hb.boxesWaiting;
      const ready = store.deliveries.filter(function (d) { return d.at <= Date.now(); }).length + s.hb.boxesWaiting;
      truckBtn.replaceChildren(h('span', { 'aria-hidden': 'true' }, '🚚'), waiting ? h('b', { class: 'zg-badge' + (ready ? ' ready' : '') }, String(waiting)) : null);
      const st = stored().length;
      boxBtn.replaceChildren(h('span', { 'aria-hidden': 'true' }, '📦'), st ? h('b', { class: 'zg-badge' }, String(st)) : null);
    }

    /* ---------- Banner: record or upload ---------- */
    function drawBanner(s) {
      const now = Date.now();
      if (placing) {
        const it = BY_ID[byKey(placing).id];
        banner.className = 'zg-banner place';
        banner.replaceChildren(h('span', null, 'Place ' + it.emoji + ' ' + it.name), h('button', { type: 'button', class: 'zg-chipbtn', onclick: function () { placing = null; drawAll(); } }, 'Cancel'));
        return;
      }
      if (picked) {
        const p = byKey(picked);
        const it = BY_ID[p.id];
        banner.className = 'zg-banner place';
        banner.replaceChildren(h('span', { class: 'zg-ban-t' }, it.emoji + ' ' + it.name, h('small', null, boostText(it.boosts))),
          h('span', { class: 'zg-ban-acts' },
            h('button', { type: 'button', class: 'zg-chipbtn', onclick: function () { placing = picked; picked = null; drawAll(); } }, 'Move'),
            h('button', { type: 'button', class: 'zg-chipbtn', onclick: function () { p.at = null; picked = null; persist(); drawAll(); } }, 'Store'),
            h('button', { type: 'button', class: 'zg-chipbtn', onclick: function () { picked = null; drawAll(); } }, '✕')));
        return;
      }
      if (store.rec) {
        const r = store.rec;
        const T = TOPICS.find(function (x) { return x[0] === r.topic; });
        const left = r.end - now;
        if (left > 0) {
          const pct = Math.min(100, (now - r.start) / (r.end - r.start) * 100);
          banner.className = 'zg-banner rec';
          banner.replaceChildren(h('span', { class: 'zg-ban-t' }, '● REC ' + T[2] + ' ' + T[1], h('small', null, clock(left) + ' left')),
            h('span', { class: 'zg-prog' }, h('i', { style: 'width:' + pct + '%' })));
        } else {
          banner.className = 'zg-banner up';
          banner.replaceChildren(h('button', { type: 'button', class: 'zg-upload', onclick: upload }, '⬆ UPLOAD ' + T[2]));
        }
        return;
      }
      banner.className = 'zg-banner idle';
      banner.replaceChildren(h('button', { type: 'button', class: 'zg-upload new', onclick: function () { open('studio'); } }, '+ NEW VLOG'));
    }

    /* ---------- Room ---------- */
    function tier(level) { return level >= 20 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0; }
    const PAL = [
      { wl: '#b9ad9d', wr: '#a79b8b', fl: '#77746e', fl2: '#6c6963', edge: '#4c4a47', crack: '#8a7f71' },
      { wl: '#d8c8a8', wr: '#c8b896', fl: '#8a6a4a', fl2: '#7f6142', edge: '#5a4430', crack: null },
      { wl: '#bcd3cc', wr: '#a9c3bb', fl: '#b88d63', fl2: '#ad845b', edge: '#7a5a3c', crack: null },
      { wl: '#c9c2e6', wr: '#b6add8', fl: '#c49b72', fl2: '#b98f67', edge: '#80603f', crack: null }
    ];
    function poly(pts, fill) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
    function diamond(cx, cy, w, hh, fill) { poly([[cx, cy - hh], [cx + w, cy], [cx, cy + hh], [cx - w, cy]], fill); }
    function rnd(i) { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

    function drawRoom(s, t) {
      const P = PAL[tier(s.level)];
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, W, H);
      const L = [OX - N * TW, OY + N * TH], R = [OX + N * TW, OY + N * TH];
      /* walls */
      poly([[OX, OY], [L[0], L[1]], [L[0], L[1] - WALL], [OX, OY - WALL]], P.wl);
      poly([[OX, OY], [R[0], R[1]], [R[0], R[1] - WALL], [OX, OY - WALL]], P.wr);
      /* wall texture: stains and cracks while poor, stripes or lights later */
      for (let i = 0; i < 70; i++) {
        const side = i % 2 ? 1 : -1, u = rnd(i) * N * TW, v = rnd(i + 99) * (WALL - 6) + 3;
        const x = OX + side * u, y = OY + (u / TW) * TH - v;
        g.fillStyle = 'rgba(0,0,0,' + (P.crack ? 0.07 : 0.035) + ')';
        g.fillRect(Math.round(x), Math.round(y), 2, 1);
      }
      if (P.crack) {
        g.fillStyle = P.crack;
        [[-70, 40], [-38, 60], [52, 30], [86, 58]].forEach(function (c, n) {
          let x = OX + c[0], y = OY + Math.abs(c[0]) / 2 - c[1];
          for (let k = 0; k < 9; k++) { g.fillRect(x, y, 1, 1); x += (n % 2 ? 1 : -1) * (k % 3 === 0 ? 0 : 1); y += 1; }
        });
      }
      if (tier(s.level) >= 2) {
        g.fillStyle = 'rgba(255,255,255,0.12)';
        for (let u = 4; u < N * TW; u += 8) { g.fillRect(OX - u, OY + u / 2 - WALL + 2, 2, WALL - 4); g.fillRect(OX + u, OY + u / 2 - WALL + 2, 2, WALL - 4); }
      }
      /* wall top trim */
      g.fillStyle = 'rgba(0,0,0,0.18)';
      for (let u = 0; u <= N * TW; u++) { g.fillRect(OX - u, OY - WALL + Math.floor(u / 2), 1, 2); g.fillRect(OX + u, OY - WALL + Math.floor(u / 2), 1, 2); }
      /* window on the right wall */
      const w0 = wallSpot('R', 3), w1 = wallSpot('R', 4);
      poly([[w0.x - 9, w0.y - 14], [w1.x + 9, w1.y - 14 + 9], [w1.x + 9, w1.y + 14 + 9], [w0.x - 9, w0.y + 14]], '#7a5232');
      poly([[w0.x - 7, w0.y - 12], [w1.x + 7, w1.y - 12 + 7], [w1.x + 7, w1.y + 12 + 7], [w0.x - 7, w0.y + 12]], '#bfe6f5');
      g.fillStyle = '#7a5232';
      const mx = (w0.x + w1.x) / 2;
      g.fillRect(Math.round(mx), Math.round((w0.y + w1.y) / 2 - 12), 2, 26);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(Math.round(w0.x - 3), Math.round(w0.y - 8), 1, 8);
      if (tier(s.level) === 3) {   /* fairy lights along the top */
        for (let u = 6; u < N * TW; u += 7) {
          g.fillStyle = (u / 7) % 2 < 1 ? '#ffe27a' : '#ffb3d1';
          const tw = (Math.floor(t / 400) + u) % 3 ? 1 : 0.4;
          g.globalAlpha = tw;
          g.fillRect(OX - u, OY - WALL + u / 2 + 6 + (u % 2), 2, 2); g.fillRect(OX + u, OY - WALL + u / 2 + 6 + (u % 2), 2, 2);
          g.globalAlpha = 1;
        }
      }
      /* floor */
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const c = cell(x, y);
        diamond(c.x, c.y, TW, TH, (x + y) % 2 ? P.fl : P.fl2);
      }
      poly([[L[0], L[1]], [OX, OY + 2 * N * TH], [OX, OY + 2 * N * TH + 4], [L[0], L[1] + 4]], P.edge);
      poly([[R[0], R[1]], [OX, OY + 2 * N * TH], [OX, OY + 2 * N * TH + 4], [R[0], R[1] + 4]], 'rgba(0,0,0,0.35)');
      if (tier(s.level) === 0) {   /* floor stains */
        g.fillStyle = 'rgba(0,0,0,0.08)';
        [[1, 3], [4, 4], [3, 1]].forEach(function (p) { const c = cell(p[0], p[1]); g.fillRect(c.x - 5, c.y - 1, 9, 3); });
      }
      if (placing) drawTargets();
      drawThings(t);
    }

    /* Free spots for the item being placed. */
    function targets() {
      const it = BY_ID[byKey(placing).id];
      const out = [];
      if (it.zone === 'floor') {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!floorAt(x, y)) out.push({ t: 'floor', x: x, y: y, c: cell(x, y) });
      } else if (it.zone === 'wall') {
        ['L', 'R'].forEach(function (side) { for (let i = 0; i < N; i++) if (!WINDOW_SLOTS[side + i] && !wallAt(side, i)) out.push({ t: 'wall', side: side, i: i, c: wallSpot(side, i) }); });
      } else {
        placed().forEach(function (p) {
          if (!BY_ID[p.id].surface || p.at.t !== 'floor') return;
          [0, 1].forEach(function (sl) { if (!topAt(p.k, sl)) out.push({ t: 'top', on: p.k, s: sl, c: topSpot(p, sl) }); });
        });
      }
      return out;
    }
    function topSpot(base, sl) {
      const c = cell(base.at.x, base.at.y);
      const hgt = BY_ID[base.id].block ? BY_ID[base.id].block[0] : 10;
      return { x: c.x + (sl ? 6 : -6), y: c.y - hgt + (sl ? 2 : -1) };
    }
    function drawTargets() {
      const blink = Math.floor(Date.now() / 350) % 2;
      targets().forEach(function (tg) {
        if (tg.t === 'floor') diamond(tg.c.x, tg.c.y, TW - 1, TH - 1, blink ? 'rgba(255,230,90,0.55)' : 'rgba(255,230,90,0.35)');
        else { g.fillStyle = blink ? 'rgba(255,230,90,0.8)' : 'rgba(255,230,90,0.5)'; g.fillRect(Math.round(tg.c.x) - 5, Math.round(tg.c.y) - 5, 10, 10); }
      });
    }

    function block(cx, cy, hgt, top, left, right) {
      const w = TW - 2, hh = TH - 1;
      poly([[cx - w, cy], [cx, cy + hh], [cx, cy + hh - hgt], [cx - w, cy - hgt]], left);
      poly([[cx + w, cy], [cx, cy + hh], [cx, cy + hh - hgt], [cx + w, cy - hgt]], right);
      diamond(cx, cy - hgt, w, hh, top);
    }
    function emoji(ch, x, y, size) {
      g.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText(ch, Math.round(x), Math.round(y));
    }

    function drawThings(t) {
      hits = [];
      const list = [];
      placed().forEach(function (p) {
        const it = BY_ID[p.id];
        if (p.at.t === 'floor') list.push({ d: p.at.x + p.at.y, p: p });
        else if (p.at.t === 'wall') list.push({ d: -10 + p.at.i * 0.01, p: p });
      });
      /* Ziery: behind the first desk, or standing in the middle. */
      const desk = placed().find(function (p) { return p.at.t === 'floor' && (p.id === 'mesa' || p.id === 'karton'); }) || placed().find(function (p) { return p.at.t === 'floor' && BY_ID[p.id].surface; });
      const zc = desk ? cell(desk.at.x, desk.at.y) : cell(3, 3);
      list.push({ d: desk ? desk.at.x + desk.at.y - 0.5 : 6.5, ziery: true });
      list.sort(function (a, b) { return a.d - b.d; });
      list.forEach(function (o) {
        if (o.ziery) {
          const bob = store.rec ? (Math.floor(t / 180) % 2) : (Math.floor(t / 700) % 2);
          const blink = Math.floor(t / 150) % 26 === 0;
          const zx = Math.round(zc.x - 6), zy = Math.round(zc.y - (desk ? 38 : 22)) - bob;
          sprite(g, ZIERY, ZPAL, zx, zy, blink);
          return;
        }
        const p = o.p, it = BY_ID[p.id];
        const pop = popKey === p.k ? Math.min(1, (t - popAt) / 400) : 1;
        if (p.at.t === 'wall') {
          const c = wallSpot(p.at.side, p.at.i);
          emoji(it.emoji, c.x, c.y + 6, Math.round(13 * pop));
          hits.push({ k: p.k, x0: c.x - 8, y0: c.y - 9, x1: c.x + 8, y1: c.y + 8 });
          return;
        }
        const c = cell(p.at.x, p.at.y);
        let topY = c.y;
        if (it.block) {
          const hgt = Math.round(it.block[0] * pop);
          block(c.x, c.y, hgt, it.block[1], it.block[2], it.block[3]);
          if (p.id === 'karton') {   /* tape and a "this side up" mark */
            g.fillStyle = '#c99256'; g.fillRect(c.x - 1, c.y - hgt - 6, 2, 13);
            g.fillStyle = '#5a3a20'; g.fillRect(c.x + 6, c.y - 6, 2, 3); g.fillRect(c.x + 9, c.y - 5, 2, 3);
          }
          if (p.id === 'tokador') { g.fillStyle = '#d7c27a'; g.fillRect(c.x - 8, c.y - 9, 2, 1); g.fillRect(c.x - 8, c.y - 3, 2, 1); g.fillRect(c.x + 6, c.y - 9, 2, 1); g.fillRect(c.x + 6, c.y - 3, 2, 1); }
          topY = c.y - hgt;
          hits.push({ k: p.k, x0: c.x - TW, y0: topY - TH, x1: c.x + TW, y1: c.y + TH });
        } else if (it.mat) {
          diamond(c.x, c.y, TW - 2, TH - 1, '#d9b97c');
          g.fillStyle = '#c29a55';
          for (let k = -10; k <= 10; k += 4) g.fillRect(c.x + k, c.y - 3 + Math.abs(k) / 4, 2, 6 - Math.abs(k) / 2);
          hits.push({ k: p.k, x0: c.x - TW, y0: c.y - TH, x1: c.x + TW, y1: c.y + TH });
        } else if (it.bed) {
          block(c.x, c.y, 8, '#f2f2f7', '#3d6fb0', '#2f5a93');
          diamond(c.x - 6, c.y - 11, 6, 3, '#ffffff');
          diamond(c.x + 3, c.y - 6, 9, 4, '#5b8fd6');
          hits.push({ k: p.k, x0: c.x - TW, y0: c.y - 16, x1: c.x + TW, y1: c.y + TH });
        } else {
          const size = Math.round(18 * pop);
          emoji(it.emoji, c.x, c.y + 4, size);
          hits.push({ k: p.k, x0: c.x - 9, y0: c.y - 15, x1: c.x + 9, y1: c.y + 5 });
        }
        if (picked === p.k) { g.strokeStyle = '#ffe25a'; g.lineWidth = 1; g.strokeRect(c.x - TW + 0.5, topY - TH - 2.5, TW * 2 - 1, c.y - topY + TH * 2 + 3); }
        /* things on top of this table */
        [0, 1].forEach(function (sl) {
          const q = topAt(p.k, sl);
          if (!q) return;
          const sp = topSpot(p, sl);
          const qi = BY_ID[q.id];
          const qp = popKey === q.k ? Math.min(1, (t - popAt) / 400) : 1;
          emoji(qi.emoji, sp.x, sp.y + 2, Math.round(13 * qp));
          if (store.rec && (q.id === 'laptop' || q.id === 'monitor') && Math.floor(t / 300) % 2) { g.fillStyle = 'rgba(177,229,242,0.35)'; g.fillRect(Math.round(sp.x) - 5, Math.round(sp.y) - 10, 10, 7); }
          hits.push({ k: q.k, x0: sp.x - 7, y0: sp.y - 11, x1: sp.x + 7, y1: sp.y + 3 });
          if (picked === q.k) { g.strokeStyle = '#ffe25a'; g.strokeRect(Math.round(sp.x) - 7.5, Math.round(sp.y) - 11.5, 15, 15); }
        });
      });
      /* Delivery truck drives across the front. */
      if (truckAt) {
        const k = (t - truckAt) / 2200;
        if (k >= 1) truckAt = 0;
        else {
          const x = -30 + k * (W + 60);
          emoji('🚚', x, H - 8, 24);
          if (k > 0.35 && k < 0.65) emoji('📦', W / 2, H - 30 + (k - 0.35) * 40, 12);
        }
      }
      if (store.rec) {
        g.fillStyle = Math.floor(t / 500) % 2 ? '#e33b36' : '#a32622';
        g.fillRect(6, 6, 5, 5);
        g.font = 'bold 8px monospace'; g.textAlign = 'left'; g.fillStyle = '#fff';
        g.fillText('REC', 14, 11);
      }
    }

    /* Taps on the room. */
    canvas.addEventListener('click', function (e) {
      const r = canvas.getBoundingClientRect();
      const px = (e.clientX - r.left) * W / r.width, py = (e.clientY - r.top) * H / r.height;
      if (placing) {
        const it = byKey(placing);
        const best = targets().map(function (tg) { return { tg: tg, d: Math.hypot(tg.c.x - px, tg.c.y - py) }; }).sort(function (a, b) { return a.d - b.d; })[0];
        if (!best || best.d > 18) { hint.textContent = 'Tap a glowing spot.'; flash(); return; }
        const tg = best.tg;
        it.at = tg.t === 'floor' ? { t: 'floor', x: tg.x, y: tg.y } : tg.t === 'wall' ? { t: 'wall', side: tg.side, i: tg.i } : { t: 'top', on: tg.on, s: tg.s };
        popKey = it.k; popAt = performance.now();
        placing = null; persist(); drawAll();
        return;
      }
      for (let i = hits.length - 1; i >= 0; i--) {
        const b = hits[i];
        if (px >= b.x0 && px <= b.x1 && py >= b.y0 && py <= b.y1) { picked = picked === b.k ? null : b.k; drawAll(); return; }
      }
      if (picked) { picked = null; drawAll(); }
    });
    function flash() { hint.classList.add('show'); clearTimeout(flash.t); flash.t = setTimeout(function () { hint.classList.remove('show'); }, 1400); }

    /* ---------- Panels ---------- */
    function open(name) {
      panel = name;
      if (name) { placing = null; picked = null; }
      screen.querySelectorAll('.zg-nb').forEach(function (b) { b.classList.toggle('on', b.dataset.p === name); });
      drawPanel(S());
      drawBanner(S());
    }
    function sheetHead(title) {
      return h('div', { class: 'zg-sh-head' }, h('h2', null, title), h('button', { type: 'button', class: 'zg-x', 'aria-label': 'Close', onclick: function () { open(null); } }, '✕'));
    }
    function drawPanel(s) {
      if (!panel) { sheet.hidden = true; return; }
      sheet.hidden = false;
      const body = h('div', { class: 'zg-sh-body' });
      let title = '';
      if (panel === 'studio') { title = 'Studio'; studioBody(s, body); }
      if (panel === 'shop') { title = 'Shop'; shopBody(s, body); }
      if (panel === 'drops') { title = 'Deliveries'; dropsBody(s, body); }
      if (panel === 'storage') { title = 'Room & storage'; storageBody(s, body); }
      if (panel === 'habits') { title = 'Real-life habits'; habitsBody(s, body); }
      if (panel === 'levels') { title = 'Levels'; levelsBody(s, body); }
      if (panel === 'help') { title = 'How to play'; helpBody(body); }
      const keep = sheet.querySelector('.zg-sh-body');
      const top = keep ? keep.scrollTop : 0;
      sheet.replaceChildren(sheetHead(title), body);
      body.scrollTop = top;
    }

    function studioBody(s, body) {
      const now = Date.now();
      const tr = trending(now);
      if (store.rec) {
        const left = store.rec.end - now;
        body.append(h('p', { class: 'zg-p' }, left > 0 ? 'Ziery is recording. Come back in ' + clock(left) + ' to upload.' : 'Your vlog is ready. Tap UPLOAD below the room.'),
          left > 0 ? h('button', { type: 'button', class: 'zg-btn ghost', onclick: function () { store.rec = null; persist(); drawAll(); } }, 'Cancel recording') : null);
        if (lastUpload) body.append(lastUpload);
        return;
      }
      body.append(
        h('p', { class: 'zg-p small' }, '🔥 Trending ×2 views · changes in ' + clock(tr.until - now)),
        h('div', { class: 'zg-topics', role: 'radiogroup', 'aria-label': 'Vlog topic' }, TOPICS.map(function (tp) {
          const hot = tr.ids.indexOf(tp[0]) !== -1;
          return h('button', { type: 'button', role: 'radio', class: 'zg-topic' + (hot ? ' hot' : ''), 'aria-checked': topic === tp[0] ? 'true' : 'false',
            onclick: function () { topic = tp[0]; drawPanel(S()); } },
            h('span', { class: 'zg-topic-e' }, tp[2]), h('span', { class: 'zg-topic-n' }, tp[1]),
            h('span', { class: 'zg-topic-b' }, (hot ? '🔥×2 ' : '') + '+' + boostFor(tp[0]) + '%'));
        })),
        h('div', { class: 'zg-seg', role: 'radiogroup', 'aria-label': 'Length' }, LENGTHS.map(function (l) {
          return h('button', { type: 'button', role: 'radio', 'aria-checked': length === l[0] ? 'true' : 'false', onclick: function () { length = l[0]; drawPanel(S()); } }, l[1], h('small', null, clock(l[2] * 1000)));
        })),
        h('p', { class: 'zg-p small' }, '≈ ' + fmt(viewsFor(s, topic, length)) + ' views' + (s.hb.boost ? ' · habits +' + s.hb.boost + '%' : '')),
        h('button', { type: 'button', class: 'zg-btn rec', onclick: record }, '● RECORD'));
      if (lastUpload) body.append(lastUpload);
    }
    function record() {
      const L = LENGTHS.find(function (x) { return x[0] === length; });
      const now = Date.now();
      store.rec = { topic: topic, len: length, start: now, end: now + L[2] * 1000 };
      persist();
      open(null);
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
      lastUpload = h('p', { class: 'zg-result' }, T[2] + ' +' + fmt(views) + ' views · +' + fmt(subs) + ' subs · +🪙' + fmt(coins));
      toast('⬆ Uploaded! +' + fmt(views) + ' views, +' + fmt(subs) + ' subscribers, +' + fmt(coins) + ' Ipon Coins');
      if (after.level > before.level) {
        if (window.PBH_FX) PBH_FX.celebrate();
        setTimeout(function () { toast('🎉 Level ' + after.level + '! New items in the shop.'); }, 1500);
      }
      drawAll();
    }

    function shopBody(s, body) {
      const filters = [['shop', 'For sale'], ['owned', 'Owned'], ['all', 'All']];
      const list = ITEMS.filter(function (i) {
        if (shopFilter === 'shop') return i.price > 0 && !owns(i.id);
        if (shopFilter === 'owned') return owns(i.id);
        return true;
      });
      body.append(h('div', { class: 'zg-seg small' }, filters.map(function (f) {
        return h('button', { type: 'button', 'aria-checked': shopFilter === f[0] ? 'true' : 'false', onclick: function () { shopFilter = f[0]; drawPanel(S()); } }, f[1]);
      })),
      list.length ? h('ul', { class: 'zg-list' }, list.map(function (i) {
        const own = owns(i.id);
        const locked = !own && s.level < i.level;
        const enough = s.coins >= i.price;
        let action;
        if (own) action = h('span', { class: 'zg-tag ok' }, i.price ? 'Owned' : 'Starter');
        else if (locked) action = h('span', { class: 'zg-tag' }, '🔒 Lv ' + i.level);
        else action = h('button', { type: 'button', class: 'zg-buy', disabled: !enough, onclick: function () { buy(i); } }, '🪙 ' + fmt(i.price));
        return h('li', { class: 'zg-li' + (locked ? ' locked' : '') },
          h('span', { class: 'zg-li-e' }, i.emoji),
          h('span', { class: 'zg-li-m' }, h('b', null, i.name), h('small', null, boostText(i.boosts)), h('small', { class: 'mut' }, (i.zone === 'top' ? 'Goes on a table' : i.zone === 'wall' ? 'Goes on a wall' : 'Goes on the floor') + (i.mins ? ' · 🚚 ' + i.mins + ' min' : ''))),
          action);
      })) : h('p', { class: 'zg-p' }, shopFilter === 'shop' ? 'You own everything. Financial independence!' : 'Nothing here yet.'));
    }
    function buy(item) {
      const s = S();
      if (owns(item.id) || s.level < item.level || s.coins < item.price) return;
      store.spent += item.price;
      store.deliveries.push({ id: item.id, at: Date.now() + item.mins * 60000 });
      persist();
      toast('🛒 ' + item.name + ' ordered. Arrives in ' + item.mins + (item.mins === 1 ? ' minute.' : ' minutes.'));
      drawAll();
    }

    function dropsBody(s, body) {
      const now = Date.now();
      const rows = [];
      if (s.hb.boxesWaiting > 0) {
        rows.push(h('li', { class: 'zg-li' }, h('span', { class: 'zg-li-e' }, '🎁'),
          h('span', { class: 'zg-li-m' }, h('b', null, s.hb.boxesWaiting === 1 ? 'Savings box' : s.hb.boxesWaiting + ' savings boxes'), h('small', null, 'One for every ' + money(BOX_EVERY) + ' you saved in real life.')),
          h('button', { type: 'button', class: 'zg-buy', onclick: openBox }, 'OPEN')));
      }
      store.deliveries.forEach(function (d) {
        const it = BY_ID[d.id], left = d.at - now;
        rows.push(h('li', { class: 'zg-li' }, h('span', { class: 'zg-li-e' }, left > 0 ? '🚚' : it.emoji),
          h('span', { class: 'zg-li-m' }, h('b', null, it.name), h('small', null, left > 0 ? 'On the way · ' + clock(left) : 'Delivered!')),
          left > 0 ? h('span', { class: 'zg-tag' }, clock(left)) : h('button', { type: 'button', class: 'zg-buy', onclick: function () { unbox(d); } }, 'UNBOX')));
      });
      body.append(rows.length ? h('ul', { class: 'zg-list' }, rows) : h('p', { class: 'zg-p' }, 'Nothing on the way. Buy something in the Shop.'),
        h('p', { class: 'zg-p small mut' }, '🎁 Next savings box: save ' + money(s.hb.nextBoxAt - s.hb.saved) + ' more in real life.'));
    }
    function unbox(d) {
      store.deliveries = store.deliveries.filter(function (x) { return x !== d; });
      const item = { k: newKey(), id: d.id, at: null };
      store.items.push(item);
      persist();
      truckAt = performance.now();
      if (window.PBH_FX) PBH_FX.celebrate();
      toast('📦 ' + BY_ID[d.id].name + ' unboxed! Tap a glowing spot to place it.');
      panel = null;
      startPlacing(item.k);
    }
    function openBox() {
      store.boxes += 1;
      persist();
      if (window.PBH_FX) PBH_FX.celebrate();
      toast('🎁 +' + PER_BOX + ' Ipon Coins!');
      drawAll();
    }
    function startPlacing(k) {
      const it = BY_ID[byKey(k).id];
      placing = k; picked = null; panel = null;
      drawAll();
      if (!targets().length) {
        placing = null;
        toast(it.zone === 'top' ? 'Place a table first, or free up a spot on one.' : 'No free spot. Store something first.');
        drawAll();
        return;
      }
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function storageBody(s, body) {
      const st = stored();
      body.append(h('p', { class: 'zg-p small' }, 'Tap an item in the room to move or store it. Only items in the room boost your vlogs.'),
        st.length ? h('ul', { class: 'zg-list' }, st.map(function (x) {
          const it = BY_ID[x.id];
          return h('li', { class: 'zg-li' }, h('span', { class: 'zg-li-e' }, it.emoji),
            h('span', { class: 'zg-li-m' }, h('b', null, it.name), h('small', null, boostText(it.boosts))),
            h('button', { type: 'button', class: 'zg-buy', onclick: function () { startPlacing(x.k); } }, 'PLACE'));
        })) : h('p', { class: 'zg-p mut' }, 'Storage is empty.'),
        h('p', { class: 'zg-p small' }, 'In the room now:'),
        h('div', { class: 'zg-chips' }, placed().map(function (x) { return h('span', { class: 'zg-chip' }, BY_ID[x.id].emoji + ' ' + BY_ID[x.id].name); })));
    }

    function habitsBody(s, body) {
      body.append(h('p', { class: 'zg-p small' }, 'Your real money habits power up Ziery’s channel.'),
        h('ul', { class: 'zg-list' }, s.hb.boosts.map(function (b) {
          return h('li', { class: 'zg-li' + (b[1] ? '' : ' locked') }, h('span', { class: 'zg-li-e' }, b[1] ? '⚡' : '💤'),
            h('span', { class: 'zg-li-m' }, h('b', null, b[0]), h('small', null, b[2])), h('span', { class: 'zg-tag' + (b[1] ? ' ok' : '') }, '+' + b[1] + '%'));
        })),
        h('p', { class: 'zg-p small' }, 'Habit allowance · ' + fmt(s.hb.coins) + ' Ipon Coins'),
        h('ul', { class: 'zg-list compact' }, s.hb.allowance.map(function (r) {
          return h('li', { class: 'zg-li' }, h('span', { class: 'zg-li-m' }, h('b', null, r[0]), h('small', null, r[3] ? money(r[1]) : fmt(r[1]))), h('span', { class: 'zg-tag' }, '🪙 ' + fmt(r[2])));
        })),
        h('a', { class: 'zg-btn', href: '#budget-plan' }, 'Log an entry'));
    }

    function levelsBody(s, body) {
      const from = subsFor(s.level), to = subsFor(Math.min(MAX_LEVEL, s.level + 1));
      body.append(
        h('p', { class: 'zg-p' }, h('b', null, 'Level ' + s.level + ' · ' + titleOf(s.level)[1])),
        h('p', { class: 'zg-p small' }, s.level >= MAX_LEVEL ? 'Max level!' : fmt(store.subs - from) + ' / ' + fmt(to - from) + ' subscribers to level ' + (s.level + 1) + ' · ' + fmt(store.videos) + ' vlogs uploaded'),
        h('ol', { class: 'zg-list' }, TITLES.slice().reverse().map(function (t) {
          return h('li', { class: 'zg-li' + (s.level >= t[0] ? '' : ' locked') }, h('span', { class: 'zg-li-e num' }, String(t[0])),
            h('span', { class: 'zg-li-m' }, h('b', null, t[1]), h('small', null, t[2]), h('small', { class: 'mut' }, fmt(subsFor(t[0])) + ' subscribers')));
        })));
      if (store.uploads.length) {
        body.append(h('p', { class: 'zg-p small' }, 'Recent uploads'), h('ul', { class: 'zg-list compact' }, store.uploads.map(function (u) {
          const T = TOPICS.find(function (x) { return x[0] === u.topic; }) || TOPICS[0];
          return h('li', { class: 'zg-li' }, h('span', { class: 'zg-li-e' }, T[2]), h('span', { class: 'zg-li-m' }, h('b', null, T[1])), h('span', { class: 'zg-tag' }, '👁 ' + fmt(u.views)));
        })));
      }
    }

    function helpBody(body) {
      body.append(h('ol', { class: 'zg-steps' },
        h('li', null, h('b', null, 'Record a vlog. '), 'Studio → pick a topic and length → RECORD. Trending topics 🔥 get double views.'),
        h('li', null, h('b', null, 'Upload. '), 'When the timer ends, tap UPLOAD for views, subscribers and Ipon Coins.'),
        h('li', null, h('b', null, 'Shop. '), 'Items boost certain topics. The truck 🚚 delivers them after a short wait.'),
        h('li', null, h('b', null, 'Decorate. '), 'Unbox, then tap a glowing spot. Tables hold small items. Tap anything to move or store it.'),
        h('li', null, h('b', null, 'Level up. '), 'Subscribers raise your level and unlock new items and a nicer room.'),
        h('li', null, h('b', null, 'Real life counts. '), 'Logging entries, your streak and saving give boosts and coins.')),
        h('p', { class: 'zg-p small mut' }, 'Your game is saved on this device.'));
    }

    /* ---------- Loop ---------- */
    function drawAll() {
      const s = S();
      drawHud(s); drawBanner(s); drawPanel(s);
      hint.textContent = placing ? 'Tap a glowing spot' : '';
      hint.classList.toggle('show', !!placing);
      drawRoom(s, performance.now());
    }
    let raf = 0, lastSec = 0, cached = null;
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (!canvas.isConnected) return;
      if (!cached || t - lastSec > 1000) {
        lastSec = t; cached = S();
        drawHud(cached); drawBanner(cached);
        if (panel === 'studio' || panel === 'drops') drawPanel(cached);
      }
      drawRoom(cached, t);
    }

    const page = h('div', { class: 'wide games zg-page' },
      h('p', { class: 'bd-kicker' }, 'Games'),
      h('h1', null, 'Ziery Simulator'),
      h('p', { class: 'muted bd-lead' }, 'Record vlogs, grow Ziery’s channel and build the dream room. Your real money habits boost every upload.'),
      screen);
    drawAll();
    raf = requestAnimationFrame(frame);
    return { el: page, refresh: function () { cached = null; drawAll(); }, stop: function () { cancelAnimationFrame(raf); } };
  }

  return { render: render, ITEMS: ITEMS, TOPICS: TOPICS, levelOf: levelOf, subsFor: subsFor, habits: habits, trending: trending };
})();
