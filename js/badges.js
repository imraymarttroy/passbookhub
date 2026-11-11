/* Badges for the Games tab. Pure rules: they read your entries, plan, savings goals, debts, accounts and a few
   app events (kept on this device) and say which badges you have earned and how close you are.
   No DOM or Firebase code lives here. Earned badges are remembered on this device, so a badge stays yours
   even if you later edit the entries.

   Kinds: auto (checked from your data), self (you tap "Mark as done": things the app can't see, like
   using a voucher), freeze (the 24-hour Impulse Freezer timer), meta (unlocks from other badges). */
window.BADGES = (function () {
  'use strict';

  const GROUPS = [
    { id: 'habit', label: 'Consistency & Habit', hint: 'For people who open the app and log every day, even the small stuff.' },
    { id: 'money', label: 'Budgeting & Savings', hint: 'Real control over your wallet: saving and staying on budget.' },
    { id: 'fun', label: 'Special & Fun', hint: 'Humor, milestones and a few surprises.' }
  ];

  /* About ₱5,000 / $100 per currency; amounts scale from pesos with this. Others use 100. */
  const PIGGY = { PHP: 5000, JPY: 15000, KRW: 130000, INR: 8000, IDR: 1500000, VND: 2500000, THB: 3500, CNY: 700, HKD: 800, ZAR: 1800, MXN: 1700, BRL: 500, SEK: 1000, NOK: 1000, DKK: 700, PLN: 400, AED: 370, SAR: 375, MYR: 450 };
  const FREEZE_MS = 24 * 60 * 60 * 1000;

  const RX = {
    drinks: /coffee|caf[eé]|kape|drinks?\b|boba|milk ?tea|bubble tea|frapp|latte|starbucks|\btea\b|juice/i,
    sweets: /milk ?tea|boba|dessert|cake|ice ?cream|donut|doughnut|sweets|chocolate|frapp|pastry|halo.?halo/i,
    utilities: /utilit|kuryente|meralco|tubig|water bill|electric|maynilad|manila water/i,
    rent: /\brent\b|\bupa\b|renta/i,
    groceries: /grocer|palengke|supermarket|market/i,
    dining: /dining|restaurant|resto\b|fast ?food|jollibee|mcdo|kfc|take ?out|delivery|grab ?food|foodpanda/i,
    subs: /subscri|netflix|spotify|youtube premium|disney|hbo|prime video|icloud/i,
    entertain: /entertain|netflix|movie|cinema|concert/i,
    invest: /invest|stock|crypto|mutual|uitf|mp2|bond|etf|\bfund\b/i,
    deposit: /time deposit|fixed deposit|\btd\b|locked/i,
    insurance: /insurance|philhealth|sun ?life|pru ?life|axa|manulife|\bhmo\b|life plan/i,
    hustle: /freelance|business|side|raket|commission|sideline|online sell/i,
    dividend: /dividend|interest/i,
    pet: /\bpets?\b|\bvet\b|veterin|dog|cat food|\baso\b|pusa/i,
    education: /education|course|\bbooks?\b|libro|tuition|udemy|coursera|seminar|training/i,
    health: /health|\bgym\b|check.?up|doctor|clinic|hospital|medic|dental/i,
    refund: /refund|return|rebate|reimburs|cashback/i,
    sold: /\bsold\b|benta|preloved|ukay|\bsell\b|garage sale/i,
    holiday: /christmas|holiday|pasko|noche|xmas|new year|bagong taon|undas/i,
    sinking: /sinking|registration|rehistro|amilyar|\blto\b|property tax|annual/i,
    gift: /gift|regalo|pasalubong/i,
    transport: /transport|commute|jeep|bus\b|\bmrt\b|\blrt\b|tricycle|bike|fare|pamasahe/i,
    ride: /grab(?! ?food)|taxi|angkas|joyride|uber/i
  };

  /*
   * The badges. test(c) returns { ok, have, goal, money } from the context c (see evaluate).
   * need lists data that must be loaded first ('goals', 'debts', 'accounts', 'circle').
   */
  const LIST = [
    /* ---------- Consistency & Habit ---------- */
    b('first-step', 'habit', '🐣', 'First Step', 'Log your first expense or set up your budget.', function (c) { return { ok: c.txs.length > 0 || c.plan.cats.length > 0 || c.plan.salaryCents > 0 }; }),
    b('streak-7', 'habit', '📅', '7-Day Streak', 'Log an entry every day for 7 days in a row.', streakTest(7)),
    b('streak-30', 'habit', '🔥', 'Month Master', 'Log an entry every day for 30 days in a row.', streakTest(30)),
    b('detective', 'habit', '🕵️', 'Receipt Detective', 'Log 50 expenses with both a category and a payment method.', function (c) { return count(c.expenses.filter(function (t) { return t.category && t.method; }).length, 50); }),
    b('early-bird', 'habit', '⏰', 'Early Bird Logger', 'Log an entry between 4:00 and 5:59 AM.', function (c) { return { ok: c.txs.some(function (t) { const hr = hourOf(t); return hr === 4 || hr === 5; }) }; }),
    b('night-owl', 'fun', '🦉', 'Night Owl Logger', 'Log an entry between 12:00 and 3:59 AM.', function (c) { return { ok: c.txs.some(function (t) { const hr = hourOf(t); return hr !== null && hr < 4; }) }; }),
    b('weekend-warrior', 'habit', '🗓️', 'Weekend Warrior', 'On a Sunday evening, log entries for both Saturday and Sunday.', function (c) {
      return { ok: c.txs.some(function (t) {
        if (typeof t.createdAt !== 'number') return false;
        const made = new Date(t.createdAt);
        if (made.getDay() !== 0 || made.getHours() < 18) return false;
        const sun = dayKey(made), sat = addDays(sun, -1);
        const sunday = made.getTime() - made.getHours() * 3600000;
        return c.txs.some(function (u) { return u.date === sat && u.createdAt >= sunday; }) && c.txs.some(function (u) { return u.date === sun && u.createdAt >= sunday; });
      }) };
    }),
    b('category-curator', 'habit', '📂', 'Category Curator', 'Create 5 of your own categories in your budget plan.', function (c) { return count(c.plan.cats.length, 5); }),
    b('filter-fanatic', 'habit', '🔍', 'Filter Fanatic', 'Filter your transaction history 10 times.', function (c) { return count(c.ev.filter || 0, 10); }),
    b('app-enthusiast', 'habit', '📱', 'App Enthusiast', 'Open PassbookHub 14 days in a row.', function (c) { return count(runOf(c.ev.days || {}, c.today).best, 14); }),
    b('century', 'habit', '💯', 'Century Club', 'Reach 100 logged entries.', function (c) { return count(c.txs.length, 100); }),
    b('milestone-500', 'habit', '🌟', 'Milestone 500', 'Reach 500 logged entries.', function (c) { return count(c.txs.length, 500); }),
    b('millennium', 'habit', '💎', 'Millennium Saver', 'Reach 1,000 logged entries. Certified power user!', function (c) { return count(c.txs.length, 1000); }),
    b('clean-slate', 'habit', '🧹', 'Clean Slate', 'Have at least 10 expenses and give every one a category.', function (c) { return { ok: c.expenses.length >= 10 && c.expenses.every(function (t) { return t.category; }) }; }),
    b('data-visualizer', 'habit', '📊', 'Data Visualizer', 'Open your Dashboard (your charts) 5 times in one week.', function (c) { return { ok: inWindow(c.ev.views && c.ev.views['dashboard'], 7 * 864e5, 5) }; }),
    b('data-exporter', 'habit', '📤', 'Data Exporter', 'Download your entries as a CSV file.', function (c) { return { ok: (c.ev.csv || 0) >= 1 }; }),
    b('goal-setter', 'habit', '🎯', 'Goal Setter', 'Give a savings goal a target date.', function (c) { return { ok: c.goals.some(function (g) { return g.due; }) }; }, ['goals']),
    b('profile-customizer', 'habit', '🛠️', 'Profile Customizer', 'Add a profile picture and your name.', function (c) { return { ok: !!(c.user.avatar && c.user.name) }; }),
    b('dark-mode', 'habit', '🌗', 'Dark Mode Devotee', 'Use PassbookHub in dark mode.', function (c) { return { ok: !!c.ev.dark }; }),
    b('security-first', 'habit', '🔐', 'Security First', 'Turn on two-step verification (OTP).', function (c) { return { ok: !!c.mfa }; }),
    b('note-taker', 'habit', '📝', 'Note Taker', 'Log every day for a week with a clear note (12+ characters) on every entry.', function (c) {
      const days = {};
      c.txs.forEach(function (t) { const d = days[t.date] = days[t.date] || { ok: true }; if ((t.desc || '').trim().length < 12) d.ok = false; });
      const good = {};
      Object.keys(days).forEach(function (k) { if (days[k].ok) good[k] = 1; });
      return count(runOf(good, c.today).best, 7);
    }),
    b('navigation-pro', 'habit', '🧭', 'Navigation Pro', 'Visit Overview, Budget, Community, Messages, Games and Profile within 5 minutes.', function (c) {
      const v = c.ev.views || {};
      const pages = ['dashboard', 'budget-plan', 'community', 'messages', 'games', 'profile'];
      const stamps = [];
      pages.forEach(function (p) { (v[p] || []).forEach(function (t) { stamps.push({ p: p, t: t }); }); });
      stamps.sort(function (a, b2) { return a.t - b2.t; });
      return { ok: stamps.some(function (s, i) {
        const seen = {};
        for (let j = i; j < stamps.length && stamps[j].t - s.t <= 5 * 60000; j++) seen[stamps[j].p] = 1;
        return Object.keys(seen).length === pages.length;
      }) };
    }),
    b('referral-rookie', 'habit', '👥', 'Referral Rookie', 'Add your first friend to your circle.', function (c) { return { ok: c.circleSize >= 1 }; }, ['circle']),
    b('streak-90', 'habit', '📅', 'Quarter Champion', 'Log every day for 90 days in a row.', streakTest(90)),
    b('streak-180', 'habit', '🏆', 'Half-Year Hero', 'Log every day for 180 days in a row.', streakTest(180)),
    b('streak-365', 'habit', '👑', 'Annual Legend', 'Log every day for a whole year (365 days).', streakTest(365)),
    b('refund-tracker', 'habit', '🔄', 'Refund Tracker', 'Record a refund, return or cashback as income.', function (c) { return { ok: c.txs.some(function (t) { return t.type === 'income' && matches(t, RX.refund); }) }; }),
    b('trend-watcher', 'habit', '📈', 'Trend Watcher', 'Check your Overview charts 3 weeks in a row.', function (c) {
      const weeks = {};
      ((c.ev.views && c.ev.views.dashboard) || []).forEach(function (t) { weeks[weekOf(dayKey(new Date(t)))] = 1; });
      return { ok: Object.keys(weeks).some(function (w) { return weeks[addDays(w, 7)] && weeks[addDays(w, 14)]; }) };
    }),
    b('zero-inbox', 'habit', '🧹', 'Zero Inbox', 'Open Alerts and clear your notifications.', function (c) { return { ok: !!c.ev.alerts }; }),
    b('first-login-year', 'habit', '🥇', 'First Login of the Year', 'Open PassbookHub on January 1.', function (c) { return { ok: Object.keys(c.ev.days || {}).some(function (k) { return k.slice(5) === '01-01'; }) }; }),
    b('birthday-budgeter', 'habit', '🎉', 'Birthday Budgeter', 'Log an entry on your birthday.', function (c) {
      const bd = (c.user.birthday || '').slice(5);
      return { ok: !!bd && c.txs.some(function (t) { return (t.date || '').slice(5) === bd; }) };
    }),
    b('holiday-planner', 'habit', '🎄', 'Holiday Planner', 'Make a holiday or Christmas category or savings goal.', function (c) {
      return { ok: c.plan.cats.some(function (x) { return RX.holiday.test(x.name); }) || c.goals.some(function (g) { return RX.holiday.test(g.name || ''); }) };
    }, ['goals']),
    b('fast-starter', 'habit', '🚀', 'Fast Starter', 'Log your first entry within 5 minutes of signing up.', function (c) {
      const first = c.txs.reduce(function (m, t) { return typeof t.createdAt === 'number' && t.createdAt < m ? t.createdAt : m; }, Infinity);
      return { ok: typeof c.user.createdAt === 'number' && first - c.user.createdAt <= 5 * 60000 && first >= c.user.createdAt };
    }),
    b('consistency-god', 'habit', '🏅', 'Ultimate Consistency God', 'Earn every other Consistency & Habit badge.', null, null, 'meta-habit'),

    /* ---------- Budgeting & Savings ---------- */
    b('under-control', 'money', '🛡️', 'Under Control', 'Finish a month with income and no Needs, Wants or category limit over budget.', function (c) { return { ok: c.done.some(function (m) { return c.withinBudget(m); }) }; }),
    b('piggy', 'money', '🐖', 'Piggy Banker', 'Save your first {5000} across your savings goals.', function (c) { return moneyCount(c.saved, c.amt(5000)); }, ['goals']),
    b('freezer', 'money', '🧊', 'Impulse Freezer', 'Freeze a purchase for 24 hours, then put the money in savings instead.', null, null, 'freeze'),
    b('emergency', 'money', '🛑', 'Emergency Guard', 'Grow your emergency fund goal to one month of Needs spending.', efundTest(1), ['goals']),
    b('cushion-3', 'money', '🏦', '3-Month Cushion', 'Grow your emergency fund to 3 months of Needs spending.', efundTest(3), ['goals']),
    b('fortress', 'money', '🏰', 'Fortress Builder', 'Reach the golden standard: a 6-month emergency fund.', efundTest(6), ['goals']),
    b('expense-slasher', 'money', '✂️', 'Expense Slasher', 'Spend at least 10% less in a month than the month before.', function (c) {
      return { ok: c.done.some(function (m) { const p = c.months[addMonths(m, -1)]; const x = c.months[m]; return p && x && p.exp > 0 && x.exp > 0 && x.exp <= p.exp * 0.9; }) };
    }),
    b('zero-spend', 'money', '🚫', 'Zero Spend Hero', 'Have a no-spend day in the middle of a logging streak (entries the day before and after).', function (c) {
      return { ok: Object.keys(c.days).some(function (d) {
        const next = addDays(d, 2), mid = addDays(d, 1);
        return c.days[next] && mid < c.today && !c.spendDays[mid] && c.dayHasEntries[d] && c.dayHasEntries[next];
      }) };
    }),
    b('target-locked', 'money', '🎯', 'Target Locked', 'Reach a savings goal before its target date.', function (c) {
      return { ok: c.goals.some(function (g) { return g.due && g.savedCents >= g.targetCents && dayKey(new Date(g.updatedAt || g.createdAt || 0)) <= g.due; }) };
    }, ['goals']),
    b('debt-slayer', 'money', '💳', 'Debt Slayer', 'Pay off a debt you owe in full.', function (c) { return { ok: c.debts.some(function (d) { return d.dir === 'owe' && d.cents > 0 && d.paidCents >= d.cents; }) }; }, ['debts']),
    b('inflation-defeated', 'money', '📉', 'Inflation Defeated', 'When your income goes up, put at least the raise into savings that month.', function (c) {
      return { ok: c.done.some(function (m) { const p = c.months[addMonths(m, -1)], x = c.months[m]; return p && x && p.income > 0 && x.income > p.income && x.savings - p.savings >= x.income - p.income; }) };
    }),
    b('seed-investor', 'money', '🌱', 'Seed Investor', 'Put money into investments (stocks, crypto, funds, MP2…).', function (c) { return { ok: c.txs.some(function (t) { return t.type === 'savings' && matches(t, RX.invest); }) }; }),
    b('fixed-deposit', 'money', '🔒', 'Fixed Deposit Master', 'Save into a time deposit or locked savings.', function (c) { return { ok: c.txs.some(function (t) { return t.type === 'savings' && matches(t, RX.deposit); }) }; }),
    b('insurance', 'money', '🩺', 'Insurance Secured', 'Log a payment for health or life insurance.', function (c) { return { ok: c.expenses.some(function (t) { return matches(t, RX.insurance); }) }; }),
    b('utility-optimizer', 'money', '💡', 'Utility Optimizer', 'Spend less on utilities than the same month last year.', function (c) {
      return { ok: c.done.some(function (m) { const a = c.spent(m, RX.utilities), p = c.spent(addMonths(m, -12), RX.utilities); return a > 0 && p > 0 && a < p; }) };
    }),
    b('transport-switcher', 'money', '🚗', 'Transport Switcher', 'Commute or bike for a week with no Grab or taxi rides.', function (c) {
      return { ok: Object.keys(c.weeks).some(function (w) {
        const list = c.weeks[w];
        return addDays(w, 6) < c.today && list.some(function (t) { return isExpense(t) && matches(t, RX.transport); }) && !list.some(function (t) { return isExpense(t) && matches(t, RX.ride); });
      }) };
    }),
    b('cart-abandoner', 'money', '🛍️', 'Cart Abandoner', 'Put something in your cart, wait, then cancel it.', null, null, 'self'),
    b('coupon-hunter', 'money', '🧾', 'Coupon Hunter', 'Use a discount or voucher to pay less.', null, null, 'self'),
    b('split-settlement', 'money', '🤝', 'Split Settlement', 'Pay back a friend within 24 hours of adding the debt.', function (c) {
      return { ok: c.debts.some(function (d) { return d.dir === 'owe' && d.cents > 0 && d.paidCents >= d.cents && d.updatedAt - d.createdAt <= 864e5; }) };
    }, ['debts']),
    b('bulk-buyer', 'money', '📦', 'Bulk Buyer', 'Save by buying groceries in bulk for the whole month.', null, null, 'self'),
    b('tax-ready', 'money', '📑', 'Tax Preparedness', 'Keep every receipt you need for taxes or business expenses.', null, null, 'self'),
    b('disciple-503020', 'money', '⚖️', '50/30/20 Disciple', 'Finish a month with Needs at most 50%, Wants at most 30% and Savings at least 20% of income.', function (c) {
      return { ok: c.done.some(function (m) { const x = c.months[m]; return x.income > 0 && x.needs <= x.income * 0.5 && x.wants <= x.income * 0.3 && x.savings >= x.income * 0.2; }) };
    }),
    b('net-worth', 'money', '📈', 'Net Worth Positive', 'Own more than you owe across your accounts and debts.', function (c) { return { ok: c.hasAccounts && c.netWorth > 0 }; }, ['accounts', 'debts']),
    b('coin-collector', 'money', '🪙', 'Coin Collector', 'Save all your loose change in a piggy bank, then move it to savings.', null, null, 'self'),
    b('sale-survivor', 'money', '🏷️', 'Sale Survivor', 'Get through a 9.9, 10.10, 11.11 or 12.12 sale day with entries but no Wants.', function (c) {
      return { ok: Object.keys(c.dayHasEntries).some(function (d) { const md = d.slice(5); return ['09-09', '10-10', '11-11', '12-12'].indexOf(md) !== -1 && d < c.today && !c.wantDays[d]; }) };
    }),
    b('side-hustle', 'money', '💼', 'Side Hustle Earner', 'Log income from freelance, a business or a side hustle.', function (c) { return { ok: c.txs.some(function (t) { return t.type === 'income' && matches(t, RX.hustle); }) }; }),
    b('dividend', 'money', '💸', 'Dividend Collector', 'Log your first dividend or interest income.', function (c) { return { ok: c.txs.some(function (t) { return t.type === 'income' && matches(t, RX.dividend); }) }; }),
    b('rent-optimizer', 'money', '🏠', 'Rent Optimizer', 'Pay less rent in a month than the month before.', function (c) {
      return { ok: c.done.some(function (m) { const a = c.spent(m, RX.rent), p = c.spent(addMonths(m, -1), RX.rent); return a > 0 && p > 0 && a < p; }) };
    }),
    b('meal-prep', 'money', '🍲', 'Meal Prep Master', 'Spend more on groceries than eating out for 2 weeks in a row.', function (c) {
      function good(w) { const l = c.weeks[w] || []; const g = sum(l.filter(function (t) { return isExpense(t) && matches(t, RX.groceries); })); const d = sum(l.filter(function (t) { return isExpense(t) && matches(t, RX.dining); })); return g > 0 && g > d; }
      return { ok: Object.keys(c.weeks).some(function (w) { return addDays(w, 13) < c.today && good(w) && good(addDays(w, 7)); }) };
    }),
    b('home-brewer', 'money', '☕', 'Home Brewer', 'Save by making coffee at home instead of buying it.', null, null, 'self'),
    b('energy-saver', 'money', '🔋', 'Energy Saver', 'Get your utility bill lower than the month before.', function (c) {
      return { ok: c.done.some(function (m) { const a = c.spent(m, RX.utilities), p = c.spent(addMonths(m, -1), RX.utilities); return a > 0 && p > 0 && a < p; }) };
    }),
    b('sub-auditor', 'money', '🔄', 'Subscription Auditor', 'Spend less on subscriptions in a month than the month before.', function (c) {
      return { ok: c.done.some(function (m) { const a = c.spent(m, RX.subs), p = c.spent(addMonths(m, -1), RX.subs); return p > 0 && a < p; }) };
    }),
    b('gift-budgeter', 'money', '🎁', 'Gift Budgeter', 'Buy a gift in a month where Wants still stayed within budget.', function (c) {
      return { ok: c.done.some(function (m) { const x = c.months[m]; return x.income > 0 && x.wants <= x.income * c.shares.wants / 100 && x.list.some(function (t) { return isExpense(t) && matches(t, RX.gift); }); }) };
    }),
    b('travel-fund', 'money', '✈️', 'Travel Fund Starter', 'Start a separate savings goal for your next trip.', goalKind('travel'), ['goals']),
    b('education-investor', 'money', '🎓', 'Education Investor', 'Budget for courses, books or a skills upgrade.', function (c) { return { ok: goalKind('education')(c).ok || c.expenses.some(function (t) { return matches(t, RX.education); }) }; }, ['goals']),
    b('gadget-fund', 'money', '💻', 'Gadget Fund', 'Save into a gadget goal for your next laptop or phone.', goalKind('gadget'), ['goals']),
    b('wellness', 'money', '🧘', 'Wellness Budget', 'Make a health goal or budget for check-ups and the gym.', function (c) { return { ok: goalKind('health')(c).ok || c.expenses.some(function (t) { return matches(t, RX.health); }) }; }, ['goals']),
    b('pet-protector', 'money', '🐾', 'Pet Protector', 'Budget for your pet’s food and vet visits.', function (c) { return { ok: c.expenses.some(function (t) { return matches(t, RX.pet); }) || c.plan.cats.some(function (x) { return RX.pet.test(x.name); }) }; }),
    b('closet-cleanout', 'money', '🧹', 'Closet Cleanout', 'Sell old clothes or things and log the income.', function (c) { return { ok: c.txs.some(function (t) { return t.type === 'income' && matches(t, RX.sold); }) }; }),
    b('credit-guardian', 'money', '🛡️', 'Credit Score Guardian', 'Track at least one debt you owe and have none overdue.', function (c) {
      const owe = c.debts.filter(function (d) { return d.dir === 'owe'; });
      return { ok: owe.length > 0 && !owe.some(function (d) { return d.due && d.due < c.today && d.paidCents < d.cents; }) };
    }, ['debts']),
    b('variance-minimizer', 'money', '📊', 'Variance Minimizer', 'Finish a month with Needs and Wants each within 5% of their targets.', function (c) {
      return { ok: c.done.some(function (m) {
        const x = c.months[m]; if (x.income <= 0) return false;
        const tn = x.income * c.shares.needs / 100, tw = x.income * c.shares.wants / 100;
        return tn > 0 && tw > 0 && Math.abs(x.needs - tn) <= tn * 0.05 && Math.abs(x.wants - tw) <= tw * 0.05;
      }) };
    }),
    b('fire-10', 'money', '💪', 'Financial Independence Seeker', 'Save 10% of your FIRE number (25 years of expenses).', function (c) {
      if (c.avgExp <= 0) return { ok: false };
      return moneyCount(c.saved, Math.round(c.avgExp * 12 * 25 * 0.1 / 100));
    }, ['goals']),
    b('compound', 'money', '🔥', 'Compound Interest Believer', 'Leave a savings goal untouched for 6 months.', function (c) {
      return { ok: c.goals.some(function (g) { return g.savedCents > 0 && c.now - (g.updatedAt || g.createdAt || c.now) >= 182 * 864e5; }) };
    }, ['goals']),
    b('scam-dodger', 'money', '🛡️', 'Scam Dodger', 'Spot and avoid a suspicious transaction or online scam.', null, null, 'self'),
    b('sinking-fund', 'money', '🎯', 'Sinking Fund Creator', 'Make a goal for a yearly cost like car registration or property tax.', function (c) { return { ok: c.goals.some(function (g) { return RX.sinking.test(g.name || ''); }) }; }, ['goals']),
    b('wealth-builder', 'money', '🌟', 'Wealth Builder', 'Reach {100000} in total savings.', function (c) { return moneyCount(c.wealth, c.amt(100000)); }, ['goals']),
    b('half-millionaire', 'money', '🏆', 'Half-Millionaire', 'Reach {500000} in total savings.', function (c) { return moneyCount(c.wealth, c.amt(500000)); }, ['goals']),
    b('million-club', 'money', '🥇', 'Million Club', 'Reach your first {1000000} in savings or net worth.', function (c) { return moneyCount(c.wealth, c.amt(1000000)); }, ['goals']),
    b('zen-master', 'money', '🧘', 'Financial Zen Master', 'Stay within budget 6 months in a row.', function (c) {
      let run = 0, best = 0, prev = null;
      c.done.forEach(function (m) {
        if (!c.withinBudget(m)) run = 0;
        else run = prev === addMonths(m, -1) && run > 0 ? run + 1 : 1;
        prev = m;
        if (run > best) best = run;
      });
      return count(best, 6);
    }),
    b('money-guru', 'money', '👑', 'Ultimate Money Guru', 'Earn every other Budgeting & Savings badge.', null, null, 'meta-money'),

    /* ---------- Special & Fun ---------- */
    b('no-boba', 'fun', '🧋', 'No-Boba Champion', 'Go a full week (Mon to Sun) with at least 3 entries and no coffee or drinks.', function (c) {
      return { ok: Object.keys(c.weeks).some(function (w) { const l = c.weeks[w]; return addDays(w, 6) < c.today && l.length >= 3 && !l.some(function (t) { return isExpense(t) && matches(t, RX.drinks); }); }) };
    }),
    b('zero-waste', 'fun', '🧹', 'Zero Waste', 'Review your subscriptions and cancel one you don’t use.', null, null, 'self'),
    b('wizard', 'fun', '🧙', 'Budget Wizard', 'Create 3 or more savings goals (Travel, Tech, Emergency…).', function (c) { return count(c.goals.length, 3); }, ['goals']),
    b('midnight-survivor', 'fun', '🍕', 'Late Night Delivery Survivor', 'Skip the midnight fast-food order, even when hungry.', null, null, 'self'),
    b('noodle-night', 'fun', '🍜', 'Instant Noodle Night', 'Eat cheap one night to stretch the budget before payday.', null, null, 'self'),
    b('cart-warrior', 'fun', '🛒', 'Shopee/Lazada Cart Warrior', 'Fill your cart, then stop yourself from checking out.', null, null, 'self'),
    b('dasurv', 'fun', '💅', '“Dasurv” Moment', 'Treat yourself after a tough week, within your budget.', null, null, 'self'),
    b('halaman', 'fun', '🪴', '“Gusto ko na lang maging halaman” Phase', 'Log a big expense, then stare at the screen for a while.', null, null, 'self'),
    b('crystal-ball', 'fun', '🔮', 'Crystal Ball Predictor', 'Finish a month with expenses within 1% of your Needs + Wants target.', function (c) {
      return { ok: c.done.some(function (m) { const x = c.months[m]; const t = x.income * (c.shares.needs + c.shares.wants) / 100; return t > 0 && Math.abs(x.exp - t) <= t * 0.01; }) };
    }),
    b('ghost-finder', 'fun', '👻', 'Ghost Transaction Finder', 'Find a small auto-deduction in your bank you hadn’t noticed.', null, null, 'self'),
    b('puzzle-solver', 'fun', '🧩', 'Puzzle Solver', 'Find the typo that made your balance look wrong.', null, null, 'self'),
    b('speed-run', 'fun', '⚡', 'Speed Run', 'Log 10 entries within 5 minutes.', function (c) {
      const t = c.txs.map(function (x) { return x.createdAt; }).filter(function (x) { return typeof x === 'number'; }).sort(function (a, b2) { return a - b2; });
      return { ok: t.some(function (x, i) { return t[i + 9] !== undefined && t[i + 9] - x <= 5 * 60000; }) };
    }),
    b('meme-lord', 'fun', '🎨', 'Meme Lord', 'Write a funny note on a serious transaction.', null, null, 'self'),
    b('alchemist', 'fun', '⚗️', 'Alchemist', 'Fix an entry by changing its type (say, from Wants to Savings).', function (c) { return { ok: !!c.ev.alchemist }; }),
    b('to-the-moon', 'fun', '🚀', 'To The Moon', 'Set a savings goal of {10000000} or more.', function (c) { return { ok: c.goals.some(function (g) { return g.targetCents >= c.amt(10000000) * 100; }) }; }, ['goals']),
    b('time-traveler', 'fun', '⌛', 'Time Traveler', 'Log a forgotten entry from a week or more ago, or a future one.', function (c) {
      return { ok: c.txs.some(function (t) { if (typeof t.createdAt !== 'number') return false; const made = dayKey(new Date(t.createdAt)); return t.date > made || addDays(t.date, 7) <= made; }) };
    }),
    b('symphony', 'fun', '🎶', 'Symphony of Coins', 'Hear the victory chime 5 times in one day.', function (c) { return { ok: Object.keys(c.ev.chime || {}).some(function (d) { return c.ev.chime[d] >= 5; }) }; }),
    b('spreadsheet-ruler', 'fun', '👑', 'Ruler of the Spreadsheet', 'Download your entries as CSV 5 times for your own formulas.', function (c) { return count(c.ev.csv || 0, 5); }),
    b('sweet-tooth', 'fun', '🧁', 'Sweet Tooth Control', 'Go 14 days of logging with no milk tea or desserts.', function (c) {
      return { ok: Object.keys(c.dayHasEntries).some(function (d) {
        const end = addDays(d, 13); if (end >= c.today) return false;
        let logged = 0;
        for (let i = 0; i < 14; i++) { const k = addDays(d, i); if (c.sweetDays[k]) return false; if (c.dayHasEntries[k]) logged++; }
        return logged >= 7;
      }) };
    }),
    b('netflix-chill', 'fun', '🎬', 'Netflix & Chill Budget', 'Spend 90–100% of an entertainment category limit in a month.', function (c) {
      const caps = c.plan.cats.filter(function (x) { return x.cents > 0 && RX.entertain.test(x.name); });
      return { ok: caps.some(function (cap) { return c.done.some(function (m) { const s = sum(c.months[m].list.filter(function (t) { return (t.category || '').toLowerCase() === cap.name.toLowerCase(); })); return s >= cap.cents * 0.9 && s <= cap.cents; }); }) };
    }),
    b('arcade', 'fun', '🕹️', 'Arcade Mode', 'Open the Games tab on 7 different days.', function (c) { return count(Object.keys(c.ev.gameDays || {}).length, 7); }),
    b('unboxing', 'fun', '📦', 'Unboxing Restraint', 'Wait 3 days before opening a package that arrived.', null, null, 'self'),
    b('lost-found', 'fun', '🧭', 'Lost and Found', 'Find where missing cash went, thanks to your detailed logs.', null, null, 'self'),
    b('superhero', 'fun', '🦸', 'Financial Superhero', 'Remind a friend to budget before going out.', null, null, 'self'),
    b('gandalf', 'fun', '🧙‍♂️', 'Gandalf Moment', 'Tell yourself “You shall not pass!” in front of a mall sale.', null, null, 'self'),
    b('unicorn', 'fun', '🦄', 'Unicorn Sighting', 'Find the secret hidden somewhere on the Games page.', function (c) { return { ok: !!c.ev.egg }; }, null, 'secret'),
    b('castaway', 'fun', '🏝️', 'Castaway', 'Survive a whole month on a strict budget: 10+ entries and no Wants.', function (c) { return { ok: c.done.some(function (m) { const x = c.months[m]; return x.list.length >= 10 && x.wants === 0; }) }; }),
    b('wonder', 'fun', '🦸‍♀️', 'Wonder Woman', 'Juggle it all: track a bill you owe, save into a goal and log side-hustle income.', function (c) {
      return { ok: c.debts.some(function (d) { return d.dir === 'owe'; }) && c.goals.some(function (g) { return g.savedCents > 0; }) && c.txs.some(function (t) { return t.type === 'income' && matches(t, RX.hustle); }) };
    }, ['goals', 'debts']),
    b('mermaid-tears', 'fun', '🧜‍♀️', 'Mermaid Tears', 'Cry a little when your pay runs out before cutoff, then keep going.', null, null, 'self'),
    b('hall-of-famer', 'fun', '👑', 'Hall of Famer', 'Top your circle leaderboard (with at least one friend on it).', function (c) { return { ok: !!c.topOfCircle }; }, ['circle']),
    b('missing-piece', 'fun', '🧩', 'Missing Piece', 'Figure out why your cash count was short.', null, null, 'self'),
    b('survivor-s1', 'fun', '🏆', 'Survivor Season 1', 'Finish your first full month with money left over.', function (c) {
      const first = c.firstMonth; if (!first) return { ok: false };
      const m = addMonths(first, 1); const x = c.months[m];
      return { ok: m < c.thisMonth && !!x && x.income > x.exp + x.savings };
    }),
    b('shooting-star', 'fun', '🌠', 'Shooting Star', 'Make a surprise savings deposit 3× your usual and at least {1000}.', function (c) {
      const s = c.txs.filter(function (t) { return t.type === 'savings'; });
      if (s.length < 4) return { ok: false };
      const avg = sum(s) / s.length;
      return { ok: s.some(function (t) { return t.cents >= avg * 3 && t.cents >= c.amt(1000) * 100; }) };
    }),
    b('lucky-charm', 'fun', '🍀', 'Lucky Charm', 'Wait for a cashback or promo and get something free.', null, null, 'self'),
    b('wizards-staff', 'fun', '🪄', 'Wizard’s Staff', 'Earn 75% of all badges.', null, null, 'meta-75'),
    b('budget-legend', 'fun', '🏆', 'Ultimate Budget Legend', 'Earn 90% of all badges. The one true legend!', null, null, 'meta-90')
  ];

  function b(id, group, emoji, name, how, test, need, kind) {
    return { id: id, group: group, emoji: emoji, name: name, how: how, test: test, need: need || [], kind: kind || (test ? 'auto' : 'self') };
  }

  /* ---------- Small helpers ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromKey(key) { const p = key.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(key, n) { const d = fromKey(key); d.setDate(d.getDate() + n); return dayKey(d); }
  function addMonths(m, n) { const p = m.split('-'); const d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function weekOf(key) { const d = fromKey(key); return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))); }
  function hourOf(t) { return typeof t.createdAt === 'number' ? new Date(t.createdAt).getHours() : null; }
  function isExpense(t) { return t.type === 'needs' || t.type === 'wants'; }
  function matches(t, rx) { return rx.test(t.category || '') || rx.test(t.desc || ''); }
  function sum(list) { return list.reduce(function (a, t) { return a + (t.cents || 0); }, 0); }
  function count(have, goal) { return { ok: have >= goal, have: have, goal: goal }; }
  function moneyCount(cents, units) { return { ok: cents >= units * 100, have: Math.floor(cents / 100), goal: units, money: true }; }
  function inWindow(stamps, ms, n) { const s = (stamps || []).slice().sort(); return s.some(function (t, i) { return s[i + n - 1] !== undefined && s[i + n - 1] - t <= ms; }); }
  function streakTest(n) { return function (c) { return { ok: c.streak.best >= n, have: Math.max(c.streak.current, Math.min(c.streak.best, n)), goal: n }; }; }
  function efundTest(months) {
    return function (c) { return c.avgNeeds > 0 ? moneyCount(c.efund, Math.ceil(c.avgNeeds * months / 100)) : { ok: false }; };
  }
  function goalKind(kind) { return function (c) { return { ok: c.goals.some(function (g) { return g.kind === kind && (kind === 'travel' || g.savedCents > 0); }) }; }; }

  /** Longest run of days in a set, and the run still going (today, or up to yesterday). */
  function runOf(days, today) {
    const keys = Object.keys(days).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach(function (k) { run = prev && addDays(prev, 1) === k ? run + 1 : 1; if (run > best) best = run; prev = k; });
    let current = 0;
    let k = days[today] ? today : addDays(today, -1);
    while (days[k]) { current++; k = addDays(k, -1); }
    return { best: best, current: current };
  }

  function money(units, currency) {
    try { return BT.formatMoney(Math.round(units * 100), currency); }
    catch (e) { return units + ' ' + currency; }
  }

  /** Everything the rules need, worked out once. */
  function context(input) {
    const txs = (input.txs || []).filter(function (t) { return t && typeof t.cents === 'number' && typeof t.date === 'string'; });
    const rawPlan = input.plan || {};
    const plan = { shares: rawPlan.shares || { needs: 50, wants: 30, savings: 20 }, cats: rawPlan.cats || [], salaryCents: rawPlan.salaryCents || 0 };
    const today = input.today || dayKey(new Date());
    const thisMonth = today.slice(0, 7);
    const currency = input.currency || 'PHP';
    const rate = (PIGGY[currency] || 100) / 5000;
    const goals = input.goals || [], debts = input.debts || [], accounts = input.accounts || [];

    const days = {}, dayHasEntries = {}, spendDays = {}, wantDays = {}, sweetDays = {}, months = {}, weeks = {};
    txs.forEach(function (t) {
      days[t.date] = 1; dayHasEntries[t.date] = 1;
      if (isExpense(t)) spendDays[t.date] = 1;
      if (t.type === 'wants') wantDays[t.date] = 1;
      if (isExpense(t) && matches(t, RX.sweets)) sweetDays[t.date] = 1;
      const m = t.date.slice(0, 7);
      const x = months[m] = months[m] || { income: 0, needs: 0, wants: 0, savings: 0, exp: 0, list: [] };
      if (x[t.type] !== undefined) x[t.type] += t.cents;
      if (isExpense(t)) x.exp += t.cents;
      x.list.push(t);
      (weeks[weekOf(t.date)] = weeks[weekOf(t.date)] || []).push(t);
    });
    const done = Object.keys(months).filter(function (m) { return m < thisMonth; }).sort();
    const needsDone = done.filter(function (m) { return months[m].needs > 0; });
    const avgNeeds = needsDone.length ? Math.round(needsDone.reduce(function (a, m) { return a + months[m].needs; }, 0) / needsDone.length) : (months[thisMonth] ? months[thisMonth].needs : 0);
    const expDone = done.filter(function (m) { return months[m].exp > 0; });
    const avgExp = expDone.length ? Math.round(expDone.reduce(function (a, m) { return a + months[m].exp; }, 0) / expDone.length) : 0;
    const caps = plan.cats.filter(function (x) { return x.cents > 0 && x.type !== 'income'; });
    const saved = goals.reduce(function (a, g) { return a + (g.savedCents || 0); }, 0);
    const efund = goals.filter(function (g) { return g.kind === 'emergency'; }).reduce(function (a, g) { return a + (g.savedCents || 0); }, 0);
    let netWorth = 0;
    accounts.forEach(function (a) { netWorth += (a.type === 'credit' || a.type === 'loan' ? -1 : 1) * (a.cents || 0); });
    debts.forEach(function (d) { const left = Math.max(0, (d.cents || 0) - (d.paidCents || 0)); netWorth += d.dir === 'lent' ? left : -left; });

    const c = {
      txs: txs, expenses: txs.filter(isExpense), plan: plan, shares: plan.shares, goals: goals, debts: debts,
      hasAccounts: accounts.length > 0, netWorth: netWorth, today: today, thisMonth: thisMonth, now: input.now || Date.now(),
      user: input.user || {}, mfa: !!input.mfa, ev: (input.store && input.store.events) || {},
      circleSize: input.circleSize || 0, topOfCircle: !!input.topOfCircle,
      days: days, dayHasEntries: dayHasEntries, spendDays: spendDays, wantDays: wantDays, sweetDays: sweetDays,
      months: months, weeks: weeks, done: done, firstMonth: Object.keys(months).sort()[0] || null,
      streak: runOf(days, today), avgNeeds: avgNeeds, avgExp: avgExp, saved: saved, efund: efund,
      wealth: Math.max(saved, accounts.length ? netWorth : 0),
      amt: function (php) { return Math.round(php * rate); },
      spent: function (m, rx) { return months[m] ? sum(months[m].list.filter(function (t) { return isExpense(t) && matches(t, rx); })) : 0; },
      withinBudget: function (m) {
        const x = months[m]; if (!x || x.income <= 0) return false;
        if (x.needs > Math.round(x.income * plan.shares.needs / 100) || x.wants > Math.round(x.income * plan.shares.wants / 100)) return false;
        return caps.every(function (cap) { return sum(x.list.filter(function (t) { return (t.category || '').toLowerCase() === cap.name.toLowerCase(); })) <= cap.cents; });
      }
    };
    return c;
  }

  /**
   * Works out every badge. input: { txs, plan, goals, debts, accounts, circleSize, topOfCircle (null while loading),
   * user, mfa, currency, today, store }. Returns the badges with { earned, earnedAt, newlyMet, waiting, progress }.
   */
  function evaluate(input) {
    const store = input.store || { earned: {}, claims: {}, events: {} };
    const c = context(input);
    const loaded = { goals: !!input.goals, debts: !!input.debts, accounts: !!input.accounts, circle: input.circleSize !== undefined && input.circleSize !== null };
    const out = LIST.map(function (x) {
      const earnedAt = store.earned[x.id] || null;
      let r = { ok: false }, waiting = false;
      if (x.kind === 'self' || x.kind === 'freeze') r = { ok: !!store.claims[x.id] };
      else if (x.kind === 'auto' || x.kind === 'secret') {
        if (x.need.some(function (n) { return !loaded[n]; })) waiting = true;
        else { try { r = x.test(c) || { ok: false }; } catch (e) { r = { ok: false }; } }
      }
      return finish(x, r, earnedAt, waiting, input.currency || 'PHP', c);
    });
    /* Meta badges look at the others. */
    out.forEach(function (x, i) {
      if (x.kind.indexOf('meta') !== 0) return;
      const others = out.filter(function (y) { return y.kind.indexOf('meta') !== 0; });
      let have, goal;
      if (x.kind === 'meta-habit' || x.kind === 'meta-money') {
        const g = x.kind === 'meta-habit' ? 'habit' : 'money';
        const pool = others.filter(function (y) { return y.group === g; });
        have = pool.filter(function (y) { return y.earned; }).length; goal = pool.length;
      } else {
        have = others.filter(function (y) { return y.earned; }).length;
        goal = Math.ceil(others.length * (x.kind === 'meta-75' ? 0.75 : 0.9));
      }
      out[i] = finish(LIST[i], { ok: have >= goal, have: have, goal: goal }, store.earned[x.id] || null, false, input.currency || 'PHP', c);
    });
    return out;
  }

  function finish(x, r, earnedAt, waiting, currency, c) {
    const goal = r.goal || null;
    return {
      id: x.id, group: x.group, emoji: x.emoji, name: x.name, kind: x.kind,
      claim: x.kind === 'self' ? 'self' : x.kind === 'freeze' ? 'freeze' : null,
      how: x.how.replace(/\{(\d+)\}/g, function (_, n) { return money(c.amt(+n), currency); }),
      earned: !!earnedAt || !!r.ok,
      earnedAt: earnedAt,
      newlyMet: !!r.ok && !earnedAt,
      waiting: waiting && !earnedAt,
      progress: goal && !earnedAt && !r.ok ? { have: Math.max(0, Math.min(r.have || 0, goal)), goal: goal, money: !!r.money } : null
    };
  }

  /* ---------- Remembering earned badges and app events on this device ---------- */
  function key(uid) { return 'pbh.badges.' + uid; }
  function load(uid) {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(key(uid)) || 'null'); } catch (e) { /* storage off */ }
    /* fresh: badges were never checked on this device yet (the first check records them quietly). */
    const out = { earned: {}, claims: {}, events: {}, freeze: null, fresh: !raw || (raw.seeded === false) };
    if (raw && typeof raw === 'object') {
      if (raw.earned && typeof raw.earned === 'object') out.earned = raw.earned;
      if (raw.claims && typeof raw.claims === 'object') out.claims = raw.claims;
      if (raw.events && typeof raw.events === 'object') out.events = raw.events;
      if (raw.freeze && typeof raw.freeze.start === 'number') out.freeze = { start: raw.freeze.start, item: String(raw.freeze.item || '').slice(0, 60) };
    }
    return out;
  }
  function save(uid, store) {
    try { localStorage.setItem(key(uid), JSON.stringify({ earned: store.earned, claims: store.claims, events: store.events, freeze: store.freeze, seeded: !store.fresh })); } catch (e) { /* storage off */ }
  }
  /** Records newly met badges and returns them, so the app can celebrate each one once. */
  function commit(uid, store, results) {
    const fresh = results.filter(function (x) { return x.newlyMet; });
    const now = Date.now();
    fresh.forEach(function (x) { store.earned[x.id] = now; });
    if (fresh.length || store.fresh) { store.fresh = false; save(uid, store); }
    return fresh;
  }
  /**
   * Notes something you did in the app. name: 'open', 'view' (value = page), 'filter', 'csv', 'dark',
   * 'alerts', 'alchemist', 'egg', 'chime', 'games'.
   */
  function track(uid, name, value) {
    if (!uid) return;
    const store = load(uid);
    const ev = store.events;
    const today = dayKey(new Date());
    if (name === 'open') { ev.days = ev.days || {}; if (ev.days[today]) return; ev.days[today] = 1; trimKeys(ev.days, 400); }
    else if (name === 'view') {
      ev.views = ev.views || {};
      const list = ev.views[value] = ev.views[value] || [];
      list.push(Date.now()); if (list.length > 40) list.splice(0, list.length - 40);
      if (value === 'games') { ev.gameDays = ev.gameDays || {}; ev.gameDays[today] = 1; trimKeys(ev.gameDays, 60); }
    }
    else if (name === 'filter' || name === 'csv') ev[name] = (ev[name] || 0) + 1;
    else if (name === 'chime') { ev.chime = ev.chime || {}; ev.chime[today] = (ev.chime[today] || 0) + 1; trimKeys(ev.chime, 14); }
    else { if (ev[name]) return; ev[name] = Date.now(); }
    save(uid, store);
  }
  function trimKeys(obj, max) { const k = Object.keys(obj).sort(); k.slice(0, Math.max(0, k.length - max)).forEach(function (x) { delete obj[x]; }); }

  return {
    GROUPS: GROUPS, LIST: LIST, FREEZE_MS: FREEZE_MS,
    evaluate: evaluate, load: load, save: save, commit: commit, track: track,
    /** { current, best } days in a row with at least one entry. */
    streak: function (txs, today) {
      const d = {};
      (txs || []).forEach(function (t) { if (t && typeof t.date === 'string') d[t.date] = 1; });
      return runOf(d, today || dayKey(new Date()));
    },
    /** Badge points for the leaderboard: 100 per badge. */
    points: function (results) { return results.filter(function (x) { return x.earned; }).length * 100; }
  };
})();
