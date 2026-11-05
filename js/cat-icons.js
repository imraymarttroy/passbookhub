/* Category icons for the Budget page: flat line icons, drawn in white on a dark tile.
   Only the constant markup below is ever put into the page. */
window.CAT_ICONS = (function () {
  'use strict';

  const PATHS = {
    burger: '<path d="M4 9.5a6 4.5 0 0 1 12 0z"/><path d="M3.5 12.25h13"/><path d="M4.5 14.5h11v.5a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 15z"/>',
    dining: '<path d="M5.5 3v4.5a2 2 0 0 0 4 0V3M7.5 3v14"/><path d="M14.5 17V3c-1.7 1-2.5 3-2.5 5.5V11h2.5"/>',
    coffee: '<path d="M4 8h10v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M14 9.5h1a2 2 0 0 1 0 4h-1.3M7 3.5v2M10 3.5v2"/>',
    drink: '<path d="M5 4h8v11.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 5 15.5z"/><path d="M13 7h1.5A1.5 1.5 0 0 1 16 8.5v3a1.5 1.5 0 0 1-1.5 1.5H13M7.5 7v7M10.5 7v7"/>',
    cart: '<path d="M2.5 3.5h2l1.8 9h9l1.6-6.5H5.3"/><circle cx="7.5" cy="16" r="1.2"/><circle cx="14" cy="16" r="1.2"/>',
    bag: '<path d="M4.5 6.5h11l-.8 10H5.3z"/><path d="M7.5 8.5v-3a2.5 2.5 0 0 1 5 0v3"/>',
    home: '<path d="M3 9.5 10 3.5l7 6"/><path d="M5 8v8.5h10V8M8.5 16.5V12h3v4.5"/>',
    bolt: '<path d="M11 2.5 4.5 11H10l-1 6.5L15.5 9H10z"/>',
    water: '<path d="M10 3s-5 5.6-5 9a5 5 0 0 0 10 0c0-3.4-5-9-5-9z"/>',
    wifi: '<path d="M2.5 7.5a11 11 0 0 1 15 0M5 10.5a7.2 7.2 0 0 1 10 0M7.5 13.4a3.5 3.5 0 0 1 5 0M10 16.2h.01"/>',
    phone: '<rect x="5.5" y="2.5" width="9" height="15" rx="2"/><path d="M9 14.5h2"/>',
    laptop: '<rect x="4" y="4" width="12" height="8.5" rx="1"/><path d="M2.5 15.5h15"/>',
    tv: '<rect x="2.5" y="4.5" width="15" height="10" rx="1.5"/><path d="M7 17.5h6M7.5 2 10 4.5 12.5 2"/>',
    cloud: '<path d="M6 15.5a3.5 3.5 0 0 1-.4-7A4.5 4.5 0 0 1 14.3 8a3.8 3.8 0 0 1 .2 7.5z"/>',
    bus: '<rect x="4" y="3" width="12" height="11.5" rx="2"/><path d="M4 9h12M6.5 14.5V17M13.5 14.5V17M7 12h.01M13 12h.01"/>',
    car: '<path d="M3 13.5v-3l2-4.5h10l2 4.5v3z"/><circle cx="6.5" cy="14.5" r="1.5"/><circle cx="13.5" cy="14.5" r="1.5"/><path d="M3 10.5h14"/>',
    fuel: '<path d="M4.5 17V4.5A1.5 1.5 0 0 1 6 3h5a1.5 1.5 0 0 1 1.5 1.5V17M3 17h11M4.5 9h8"/><path d="M12.5 7.5 15 9v5.5a1 1 0 0 0 2 0V7l-2-2"/>',
    bike: '<circle cx="5" cy="13" r="3"/><circle cx="15" cy="13" r="3"/><path d="M5 13 8 7h5l2 6M8 7l3 6H5M7 5h2.5"/>',
    plane: '<path d="M2.5 11.5 17.5 5l-3 10-4-3.5-3 3v-4z"/><path d="m10.5 11.5 7-6.5"/>',
    globe: '<circle cx="10" cy="10" r="7.5"/><path d="M2.5 10h15M10 2.5c2.2 2.2 3 4.8 3 7.5s-.8 5.3-3 7.5c-2.2-2.2-3-4.8-3-7.5s.8-5.3 3-7.5z"/>',
    health: '<path d="M10 16.5s-6.5-3.8-6.5-8.3A3.6 3.6 0 0 1 10 6.1a3.6 3.6 0 0 1 6.5 2.1c0 4.5-6.5 8.3-6.5 8.3z"/><path d="M6.5 10h2l1-1.5 1.5 3 1-1.5h1.5"/>',
    pill: '<rect x="2.9" y="7.1" width="14.2" height="5.8" rx="2.9" transform="rotate(-45 10 10)"/><path d="m7.5 7.5 5 5"/>',
    shield: '<path d="M10 2.5 16.5 5v4.5c0 4-2.8 6.9-6.5 8-3.7-1.1-6.5-4-6.5-8V5z"/><path d="m7.3 10 1.9 1.9 3.6-3.8"/>',
    umbrella: '<path d="M2.5 10a7.5 7.5 0 0 1 15 0z"/><path d="M10 10v5.5a1.5 1.5 0 0 0 3 0M10 2.5v1"/>',
    fitness: '<path d="M3 8v4M5.5 6v8M14.5 6v8M17 8v4M5.5 10h9"/>',
    scissors: '<circle cx="5.5" cy="14.5" r="2"/><circle cx="14.5" cy="14.5" r="2"/><path d="M7 13 15.5 3.5M13 13 4.5 3.5"/>',
    shirt: '<path d="m7 3.5-4 2.5 1.5 3.5 2-1v8h7v-8l2 1L17 6l-4-2.5a3 3 0 0 1-6 0z"/>',
    education: '<path d="m2 7.5 8-4 8 4-8 4z"/><path d="M5.5 9.3V13c0 1.2 2 2.5 4.5 2.5s4.5-1.3 4.5-2.5V9.3M18 7.5V12"/>',
    book: '<path d="M10 5.5C8.5 4 6 3.5 3 3.5v11c3 0 5.5.5 7 2 1.5-1.5 4-2 7-2v-11c-3 0-5.5.5-7 2zM10 5.5v11"/>',
    film: '<rect x="3" y="3.5" width="14" height="13" rx="1.5"/><path d="M6.5 3.5v13M13.5 3.5v13M3 7h3.5M3 10h3.5M3 13h3.5M13.5 7H17M13.5 10H17M13.5 13H17"/>',
    music: '<path d="M7.5 15V4.5l9-2V13"/><circle cx="5.5" cy="15" r="2"/><circle cx="14.5" cy="13" r="2"/>',
    game: '<path d="M6.5 6.5h7a4 4 0 0 1 4 4v1a3 3 0 0 1-5.3 1.9l-.7-.9h-3l-.7.9A3 3 0 0 1 2.5 11.5v-1a4 4 0 0 1 4-4z"/><path d="M6.5 9v2.5M5.25 10.25h2.5M13 9.5h.01M14.5 11h.01"/>',
    camera: '<path d="M3 6.5h3l1.5-2h5L14 6.5h3v9H3z"/><circle cx="10" cy="11" r="2.8"/>',
    gift: '<rect x="3" y="8" width="14" height="3.5" rx="1"/><path d="M4.5 11.5v5h11v-5M10 8v8.5"/><path d="M10 8C8.5 8 6 7.5 6 5.7S8.6 4 10 8c1.4-4 4-3.6 4-2.3S11.5 8 10 8z"/>',
    heart: '<path d="M10 16.5s-6.5-3.8-6.5-8.3A3.6 3.6 0 0 1 10 6.1a3.6 3.6 0 0 1 6.5 2.1c0 4.5-6.5 8.3-6.5 8.3z"/>',
    paw: '<circle cx="5.7" cy="8.3" r="1.4"/><circle cx="8.6" cy="5.4" r="1.4"/><circle cx="12.2" cy="5.4" r="1.4"/><circle cx="14.9" cy="8.5" r="1.4"/><path d="M10.4 10.2c-2.4 0-4.9 2.9-4.9 4.9 0 1.4 1.3 1.9 2.4 1.5 1-.3 1.7-.6 2.5-.6s1.5.3 2.5.6c1.1.4 2.4-.1 2.4-1.5 0-2-2.5-4.9-4.9-4.9z"/>',
    baby: '<circle cx="10" cy="10.5" r="6.5"/><path d="M7.7 9.5h.01M12.3 9.5h.01M8 12.7a2.6 2.6 0 0 0 4 0M10 4c-.9 0-1.5.7-1.5 1.4"/>',
    family: '<circle cx="7" cy="6" r="2.25"/><circle cx="13.5" cy="7" r="1.75"/><path d="M3 16.5V14a4 4 0 0 1 8 0v2.5M11 16.5v-2a2.5 2.5 0 0 1 5 0v2"/>',
    tools: '<path d="M12.6 3.2a3.6 3.6 0 0 0-3.4 4.7l-5.6 5.6a1.6 1.6 0 1 0 2.3 2.3l5.6-5.6a3.6 3.6 0 0 0 4.7-3.4l-2.1 1.1-1.9-1.9z"/>',
    receipt: '<path d="M5 2.5h10v15l-1.7-1.2-1.6 1.2-1.7-1.2-1.7 1.2-1.6-1.2L5 17.5z"/><path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3"/>',
    calendar: '<rect x="3" y="4" width="14" height="13" rx="1.5"/><path d="M3 8h14M7 2.5v3M13 2.5v3"/>',
    card: '<rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="M2.5 8.5h15M5.5 12.5h3"/>',
    bank: '<path d="M2.5 7.5 10 3l7.5 4.5z"/><path d="M4.5 8v6.5M8 8v6.5M12 8v6.5M15.5 8v6.5M2.5 17h15"/>',
    wallet: '<path d="M15.5 6.5V5A1.5 1.5 0 0 0 14 3.5H4.5a2 2 0 0 0 0 4"/><path d="M2.5 5.5v9a2 2 0 0 0 2 2h11a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-11a2 2 0 0 1-2-2zM13.5 12h.01"/>',
    cash: '<rect x="2.5" y="5.5" width="15" height="9" rx="1.5"/><circle cx="10" cy="10" r="2"/><path d="M5 8v4M15 8v4"/>',
    coins: '<ellipse cx="8" cy="6" rx="5" ry="2"/><path d="M3 6v3c0 1.1 2.2 2 5 2s5-.9 5-2V6M3 9v3c0 1.1 2.2 2 5 2 .7 0 1.4-.1 2-.2"/><ellipse cx="13" cy="13" rx="4" ry="1.6"/><path d="M9 13v2c0 .9 1.8 1.6 4 1.6s4-.7 4-1.6v-2"/>',
    piggy: '<path d="M15 9.5C15 6.7 12.5 5 9.5 5S4 6.7 4 9.5c0 1.4.6 2.6 1.5 3.4V16h2.2l.5-1.3c.4.1.9.1 1.3.1s.9 0 1.3-.1l.5 1.3h2.2v-3c.6-.5 1-1.1 1.3-1.8H16V9h-1.1"/><path d="M8 5.5 7 3.5l2.5.7M12 8.5h.01"/>',
    chart: '<path d="M3 16.5h14M4 12.5l4-4 3 3 5-6"/><path d="M12.5 5.5H16V9"/>',
    target: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="1"/>',
    briefcase: '<rect x="2.5" y="6.5" width="15" height="10" rx="1.5"/><path d="M7.5 6.5v-2h5v2M2.5 11h15"/>',
    donate: '<path d="M10 9.5S6.6 7.6 6.6 5.4A1.9 1.9 0 0 1 10 4.4a1.9 1.9 0 0 1 3.4 1c0 2.2-3.4 4.1-3.4 4.1z"/><path d="M2.5 12.5h3l3 1.5h2.8a1 1 0 0 1 0 2H8.5M11.5 16l4-1.8a1.2 1.2 0 0 1 1 2.1L11 18.5H5.5l-3-1.5"/>',
    star: '<path d="m10 2.8 2.2 4.6 5 .6-3.7 3.4 1 5L10 13.9l-4.5 2.5 1-5L2.8 8l5-.6z"/>',
    sun: '<circle cx="10" cy="10" r="3.2"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4"/>',
    leaf: '<path d="M4 16c0-7 4.5-11.5 12.5-12-.3 8-4.8 12.5-12 12.5zM4 16.5l7-7"/>',
    tag: '<path d="M3 3h6.5l8 8-6.5 6.5-8-8z"/><circle cx="6.5" cy="6.5" r="1.2"/>',
    box: '<path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5z"/><path d="M3 6.5 10 10l7-3.5M10 10v7"/>'
  };

  /* The order shown in the picker, with a label for screen readers. */
  const LIST = [
    ['burger', 'Food'], ['dining', 'Dining out'], ['coffee', 'Coffee'], ['drink', 'Drinks'], ['cart', 'Groceries'], ['bag', 'Shopping'],
    ['home', 'Home'], ['bolt', 'Electricity'], ['water', 'Water'], ['wifi', 'Internet'], ['phone', 'Phone'], ['laptop', 'Gadgets'],
    ['tv', 'Streaming'], ['cloud', 'Subscriptions'], ['bus', 'Commute'], ['car', 'Car'], ['fuel', 'Fuel'], ['bike', 'Bike'],
    ['plane', 'Travel'], ['globe', 'Abroad'], ['health', 'Health'], ['pill', 'Medicine'], ['shield', 'Insurance'], ['umbrella', 'Emergency'],
    ['fitness', 'Fitness'], ['scissors', 'Personal care'], ['shirt', 'Clothes'], ['education', 'Education'], ['book', 'Books'], ['film', 'Movies'],
    ['music', 'Music'], ['game', 'Games'], ['camera', 'Hobbies'], ['gift', 'Gifts'], ['heart', 'Love'], ['paw', 'Pets'],
    ['baby', 'Baby'], ['family', 'Family'], ['tools', 'Repairs'], ['receipt', 'Bills'], ['calendar', 'Dues'], ['card', 'Credit card'],
    ['bank', 'Bank'], ['wallet', 'Wallet'], ['cash', 'Cash'], ['coins', 'Salary'], ['piggy', 'Savings'], ['chart', 'Investments'],
    ['target', 'Goal'], ['briefcase', 'Business'], ['donate', 'Donations'], ['star', 'Special'], ['sun', 'Leisure'], ['leaf', 'Garden'],
    ['tag', 'Other'], ['box', 'Misc']
  ];

  /* A sensible icon for a category name when you haven't picked one. */
  const GUESS = [
    [/grocer|market|palengke/i, 'cart'], [/dining|restaurant|food|eat|grab ?food|foodpanda|jollibee/i, 'dining'], [/coffee|cafe|starbucks/i, 'coffee'],
    [/rent|house|home|condo|bahay/i, 'home'], [/electric|meralco|power|kuryente/i, 'bolt'], [/water|tubig|maynilad|manila water/i, 'water'],
    [/internet|wifi|pldt|converge|globe at home/i, 'wifi'], [/phone|load|mobile|smart|globe/i, 'phone'], [/transport|commute|bus|jeep|mrt|lrt|grab|angkas/i, 'bus'],
    [/fuel|gas|petrol/i, 'fuel'], [/car|parking|toll/i, 'car'], [/travel|trip|flight|vacation/i, 'plane'], [/health|doctor|hospital|clinic/i, 'health'],
    [/medicine|pharma|drug/i, 'pill'], [/insur/i, 'shield'], [/emergency/i, 'umbrella'], [/educat|school|tuition/i, 'education'],
    [/debt|loan|credit/i, 'card'], [/shop/i, 'bag'], [/subscri|netflix|spotify|stream/i, 'tv'], [/entertain|movie|cinema/i, 'film'],
    [/hobb/i, 'camera'], [/gift/i, 'gift'], [/personal|salon|haircut|beauty/i, 'scissors'], [/cloth|apparel/i, 'shirt'], [/gym|fitness/i, 'fitness'],
    [/pet|dog|cat/i, 'paw'], [/baby|kid|child/i, 'baby'], [/family|parents/i, 'family'], [/salary|sweldo|pay/i, 'coins'], [/business/i, 'briefcase'],
    [/freelance|work/i, 'laptop'], [/bonus/i, 'star'], [/interest|invest|stock|fund/i, 'chart'], [/retire/i, 'piggy'], [/saving|ipon/i, 'piggy'],
    [/goal/i, 'target'], [/allowance|cash/i, 'cash'], [/donat|church|tithe/i, 'donate'], [/bill/i, 'receipt']
  ];

  function has(key) { return Object.prototype.hasOwnProperty.call(PATHS, key); }
  function guess(name) {
    const hit = GUESS.find(function (g) { return g[0].test(name || ''); });
    return hit ? hit[1] : 'tag';
  }
  /** An <svg> for the icon key (falls back to a tag). */
  function svg(key) {
    const holder = document.createElement('span');
    holder.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS[has(key) ? key : 'tag'] + '</svg>';
    return holder.firstChild;
  }
  /** The dark tile with the white icon. size: 'sm' | 'md' (default) | 'lg'. */
  function tile(key, size) {
    const span = document.createElement('span');
    span.className = 'ci-tile' + (size ? ' ci-' + size : '');
    span.setAttribute('aria-hidden', 'true');
    span.appendChild(svg(key));
    return span;
  }
  return { LIST: LIST, has: has, guess: guess, svg: svg, tile: tile };
})();
