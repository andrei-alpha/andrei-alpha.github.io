/**
 * Core Roulette Wheel, Bet Evaluation, and Call Bet Definitions
 */

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36
]);

export const EUROPEAN_WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const AMERICAN_WHEEL = [
  0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1,
  '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2
];

export const VARIANTS = {
  european: {
    id: 'european',
    label: 'European (0)',
    subtitle: 'European Single-Zero • 2.70% House Edge',
    wheel: EUROPEAN_WHEEL,
    pockets: 37,
    laPartage: false
  },
  french: {
    id: 'french',
    label: 'French La Partage (0)',
    subtitle: 'French Single-Zero • 1.35% Edge on Even-Money (La Partage)',
    wheel: EUROPEAN_WHEEL,
    pockets: 37,
    laPartage: true
  },
  american: {
    id: 'american',
    label: 'American (0 & 00)',
    subtitle: 'American Double-Zero • 5.26% House Edge',
    wheel: AMERICAN_WHEEL,
    pockets: 38,
    laPartage: false
  }
};

export function getPocketColor(pocket) {
  if (pocket === 0 || pocket === '0' || pocket === '00') return 'green';
  return RED_NUMBERS.has(Number(pocket)) ? 'red' : 'black';
}

export function randomPocket(variantId) {
  const wheel = VARIANTS[variantId].wheel;
  let idx;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / wheel.length) * wheel.length;
    do {
      crypto.getRandomValues(arr);
    } while (arr[0] >= limit);
    idx = arr[0] % wheel.length;
  } else {
    idx = Math.floor(Math.random() * wheel.length);
  }
  return wheel[idx];
}

/**
 * Normalize pocket value for comparison (numbers as numbers, '00' as '00').
 */
export function normPocket(p) {
  if (p === '00') return '00';
  return Number(p);
}

/**
 * Standard bet factory.
 * bet = { id, type, label, numbers: Array<number|string>, payout: number, amount: number, isEvenMoney?: boolean }
 */
export function makeBet(id, type, label, numbers, payout, amount, isEvenMoney = false) {
  return {
    id,
    type,
    label,
    numbers: numbers.map(normPocket),
    payout,
    amount,
    isEvenMoney
  };
}

export const OUTSIDE_BETS = {
  LOW: () => makeBet('OUT_LOW', 'Even-Money', '1–18 Low', Array.from({ length: 18 }, (_, i) => i + 1), 1, 0, true),
  HIGH: () => makeBet('OUT_HIGH', 'Even-Money', '19–36 High', Array.from({ length: 18 }, (_, i) => i + 19), 1, 0, true),
  EVEN: () => makeBet('OUT_EVEN', 'Even-Money', 'Even', Array.from({ length: 18 }, (_, i) => (i + 1) * 2), 1, 0, true),
  ODD: () => makeBet('OUT_ODD', 'Even-Money', 'Odd', Array.from({ length: 18 }, (_, i) => i * 2 + 1), 1, 0, true),
  RED: () => makeBet('OUT_RED', 'Even-Money', 'Red', Array.from(RED_NUMBERS), 1, 0, true),
  BLACK: () => makeBet('OUT_BLACK', 'Even-Money', 'Black', Array.from({ length: 36 }, (_, i) => i + 1).filter(n => !RED_NUMBERS.has(n)), 1, 0, true),
  DOZ_1: () => makeBet('DOZ_1', 'Dozen', '1st 12 (1–12)', Array.from({ length: 12 }, (_, i) => i + 1), 2, 0),
  DOZ_2: () => makeBet('DOZ_2', 'Dozen', '2nd 12 (13–24)', Array.from({ length: 12 }, (_, i) => i + 13), 2, 0),
  DOZ_3: () => makeBet('DOZ_3', 'Dozen', '3rd 12 (25–36)', Array.from({ length: 12 }, (_, i) => i + 25), 2, 0),
  COL_1: () => makeBet('COL_1', 'Column', 'Col 1 (1–34)', Array.from({ length: 12 }, (_, i) => i * 3 + 1), 2, 0),
  COL_2: () => makeBet('COL_2', 'Column', 'Col 2 (2–35)', Array.from({ length: 12 }, (_, i) => i * 3 + 2), 2, 0),
  COL_3: () => makeBet('COL_3', 'Column', 'Col 3 (3–36)', Array.from({ length: 12 }, (_, i) => i * 3 + 3), 2, 0)
};

export function makeStraightBet(pocket, amount = 0) {
  const n = normPocket(pocket);
  return makeBet(`STR_${n}`, 'Straight Up', `Straight ${n}`, [n], 35, amount);
}

export function makeSplitBet(a, b, amount = 0) {
  const nums = [normPocket(a), normPocket(b)].sort(sortPockets);
  return makeBet(`SPL_${nums.join('_')}`, 'Split', `Split ${nums.join('/')}`, nums, 17, amount);
}

export function makeStreetBet(nums, amount = 0, labelOverride = null) {
  const sorted = nums.map(normPocket).sort(sortPockets);
  return makeBet(`STT_${sorted.join('_')}`, sorted.includes(0) ? 'Trio' : 'Street', labelOverride || `Street ${sorted.join('-')}`, sorted, 11, amount);
}

export function makeCornerBet(nums, amount = 0, labelOverride = null) {
  const sorted = nums.map(normPocket).sort(sortPockets);
  return makeBet(`CRN_${sorted.join('_')}`, 'Corner', labelOverride || `Corner ${sorted.join('-')}`, sorted, 8, amount);
}

export function makeTopLineBet(amount = 0) {
  return makeBet('TOPLINE_0_00_1_2_3', 'Top Line', 'Basket (0-00-1-2-3)', [0, '00', 1, 2, 3], 6, amount);
}

export function makeSixLineBet(nums, amount = 0) {
  const sorted = nums.map(normPocket).sort(sortPockets);
  return makeBet(`SIX_${sorted[0]}_${sorted[sorted.length - 1]}`, 'Six Line', `Six Line ${sorted[0]}–${sorted[sorted.length - 1]}`, sorted, 5, amount);
}

function sortPockets(a, b) {
  if (a === '00') return -1;
  if (b === '00') return 1;
  return a - b;
}

/**
 * Evaluate a list of bets against an outcome pocket under the chosen variant.
 * Returns { totalStake, totalReturn, netProfit, laPartageSaved }.
 */
export function evaluateBets(bets, outcome, variantId) {
  const hit = normPocket(outcome);
  const laPartage = VARIANTS[variantId].laPartage;
  let totalStake = 0;
  let totalReturn = 0;
  let laPartageSaved = 0;

  for (const bet of bets) {
    if (!bet || bet.amount <= 0) continue;
    totalStake += bet.amount;
    if (bet.numbers.includes(hit)) {
      totalReturn += bet.amount * (bet.payout + 1);
    } else if (laPartage && hit === 0 && bet.isEvenMoney) {
      const refund = bet.amount * 0.5;
      totalReturn += refund;
      laPartageSaved += refund;
    }
  }

  return {
    totalStake,
    totalReturn,
    netProfit: totalReturn - totalStake,
    laPartageSaved
  };
}

/**
 * Classic French Call Bets (returns array of { betTemplate, units }).
 */
export function getCallBetPattern(callName) {
  switch (callName) {
    case 'voisins':
      return [
        { bet: makeStreetBet([0, 2, 3], 0, 'Trio 0-2-3'), units: 2 },
        { bet: makeSplitBet(4, 7), units: 1 },
        { bet: makeSplitBet(12, 15), units: 1 },
        { bet: makeSplitBet(18, 21), units: 1 },
        { bet: makeSplitBet(19, 22), units: 1 },
        { bet: makeCornerBet([25, 26, 28, 29]), units: 2 },
        { bet: makeSplitBet(32, 35), units: 1 }
      ];
    case 'tiers':
      return [
        { bet: makeSplitBet(5, 8), units: 1 },
        { bet: makeSplitBet(10, 11), units: 1 },
        { bet: makeSplitBet(13, 16), units: 1 },
        { bet: makeSplitBet(23, 24), units: 1 },
        { bet: makeSplitBet(27, 30), units: 1 },
        { bet: makeSplitBet(33, 36), units: 1 }
      ];
    case 'orphelins':
      return [
        { bet: makeStraightBet(1), units: 1 },
        { bet: makeSplitBet(6, 9), units: 1 },
        { bet: makeSplitBet(14, 17), units: 1 },
        { bet: makeSplitBet(17, 20), units: 1 },
        { bet: makeSplitBet(31, 34), units: 1 }
      ];
    case 'jeuzero':
      return [
        { bet: makeSplitBet(0, 3), units: 1 },
        { bet: makeSplitBet(12, 15), units: 1 },
        { bet: makeStraightBet(26), units: 1 },
        { bet: makeSplitBet(32, 35), units: 1 }
      ];
    default:
      return [];
  }
}

export function getNeighbourPockets(centerPocket, count, variantId) {
  const wheel = VARIANTS[variantId].wheel;
  const target = normPocket(centerPocket);
  const idx = wheel.indexOf(target);
  if (idx === -1) return [target];
  const result = [];
  for (let offset = -count; offset <= count; offset++) {
    const pos = (idx + offset + wheel.length) % wheel.length;
    result.push(wheel[pos]);
  }
  return result;
}

export function formatMoney(amount, signed = false) {
  const absVal = Math.abs(amount);
  const formatted = Number.isInteger(absVal)
    ? absVal.toLocaleString('en-US')
    : absVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (signed) {
    if (amount > 0) return `+$${formatted}`;
    if (amount < 0) return `-$${formatted}`;
    return `$0`;
  }
  return amount < 0 ? `-$${formatted}` : `$${formatted}`;
}
