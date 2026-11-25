import {
  OUTSIDE_BETS,
  makeStraightBet,
  makeCornerBet,
  makeSixLineBet,
  randomPocket,
  evaluateBets
} from './roulette-engine.js';

const FIB_SEQ = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];

export const STRATEGIES = {
  romanovsky: {
    id: 'romanovsky',
    name: 'Romanovsky 24+8 (86.5% Coverage)',
    usesEvenTarget: false,
    defaultAfterLoss: 'x2',
    defaultAfterWin: 'reset',
    description:
      'High-coverage 8-unit spread: 3 units on 1st Dozen, 3 units on 2nd Dozen, and 1 unit each on Corners 25-26-28-29 and 32-33-35-36 (covers 32 of 37 pockets, 86.5% hit rate).'
  },
  martingale: {
    id: 'martingale',
    name: 'Martingale (Even-Money)',
    usesEvenTarget: true,
    defaultAfterLoss: 'x2',
    defaultAfterWin: 'reset',
    description:
      'Classic doubling system on an Even-Money bet (Red/Black/Even/Odd/1–18/19–36). Doubles stake after every loss to recover all prior losses plus 1 base unit on the next win.'
  },
  reverse_martingale: {
    id: 'reverse_martingale',
    name: 'Reverse Martingale / Paroli',
    usesEvenTarget: true,
    defaultAfterLoss: 'reset',
    defaultAfterWin: 'x2',
    description:
      'Positive-progression Paroli system: doubles stake after wins (caps at 3 consecutive wins = 8× before resetting) and resets to 1 unit after any loss.'
  },
  fibonacci: {
    id: 'fibonacci',
    name: 'Fibonacci Progression',
    usesEvenTarget: true,
    defaultAfterLoss: 'fib',
    defaultAfterWin: 'fib_back2',
    description:
      'Steps forward through the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21...) on a loss and steps back 2 positions on a win. Gentler drawdown slope than Martingale.'
  },
  dalembert: {
    id: 'dalembert',
    name: "D'Alembert System",
    usesEvenTarget: true,
    defaultAfterLoss: 'plus1',
    defaultAfterWin: 'minus1',
    description:
      'Balanced arithmetic progression: adds +1 base unit after a loss and subtracts 1 base unit (minimum 1) after a win.'
  },
  labouchere: {
    id: 'labouchere',
    name: 'Labouchère (1-2-3-4)',
    usesEvenTarget: true,
    defaultAfterLoss: 'labouchere',
    defaultAfterWin: 'labouchere',
    description:
      'Cancellation system starting with list [1, 2, 3, 4]. Bets first + last numbers; crosses them off on a win, or appends the lost stake to the end on a loss.'
  },
  oscars_grind: {
    id: 'oscars_grind',
    name: "Oscar's Grind",
    usesEvenTarget: true,
    defaultAfterLoss: 'same',
    defaultAfterWin: 'oscar',
    description:
      'Low-variance cycle grinder aiming for +1 base unit per cycle. Keeps bet flat after losses; increases by +1 unit after wins (capped so a win lands exactly at +1 cycle profit).'
  },
  james_bond: {
    id: 'james_bond',
    name: 'James Bond (20-Unit Spread)',
    usesEvenTarget: false,
    defaultAfterLoss: 'x2',
    defaultAfterWin: 'reset',
    description:
      '20-unit coverage spread: 14 units on 19–36 High, 5 units on Six Line 13–18, and 1 unit Straight Up on 0 (covers 25 of 37 pockets, 67.6% hit rate).'
  },
  double_dozen: {
    id: 'double_dozen',
    name: 'Double Dozen (64.9% Coverage)',
    usesEvenTarget: false,
    defaultAfterLoss: 'x3',
    defaultAfterWin: 'reset',
    description:
      '2-unit spread covering 24 numbers: 1 unit on 1st Dozen (1–12) and 1 unit on 2nd Dozen (13–24). Wins +1 unit on 64.9% of European spins.'
  },
  flat: {
    id: 'flat',
    name: 'Flat Betting (1 Unit)',
    usesEvenTarget: true,
    defaultAfterLoss: 'same',
    defaultAfterWin: 'same',
    description:
      'Constant 1-unit stake on an Even-Money bet regardless of win/loss history. Ideal baseline to measure pure house edge without progression variance.'
  },
  custom_felt: {
    id: 'custom_felt',
    name: 'Custom Felt Layout',
    usesEvenTarget: false,
    defaultAfterLoss: 'same',
    defaultAfterWin: 'same',
    description:
      'Uses the exact chips currently placed on the felt as the 1× base pattern, then applies your chosen After Loss / After Win progression multipliers.'
  }
};

/**
 * Stateful progression tracker for live auto-spin, manual "Place on Felt", and simulations.
 */
export class StrategyTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.multiplier = 1;
    this.fibIndex = 0;
    this.winStreak = 0;
    this.labList = [1, 2, 3, 4];
    this.oscarProfit = 0;
    this.oscarUnits = 1;
  }

  _getCurrentUnits(config) {
    const strat = STRATEGIES[config.strategyId];
    if (config.strategyId === 'labouchere' && config.afterLoss === 'default' && config.afterWin === 'default') {
      if (this.labList.length === 0) this.labList = [1, 2, 3, 4];
      return this.labList.length === 1
        ? this.labList[0]
        : this.labList[0] + this.labList[this.labList.length - 1];
    }
    if (config.strategyId === 'oscars_grind' && config.afterLoss === 'default' && config.afterWin === 'default') {
      return this.oscarUnits;
    }
    if (config.afterLoss === 'fib' || (config.afterLoss === 'default' && strat.defaultAfterLoss === 'fib')) {
      return FIB_SEQ[Math.min(this.fibIndex, FIB_SEQ.length - 1)];
    }
    return Math.max(1, Math.round(this.multiplier * 100) / 100);
  }

  /**
   * Build the bet array for the next spin given config, bankroll, and optional custom felt pattern.
   */
  buildNextBets(config, bankroll, customPattern = []) {
    const unit = Math.max(1, Number(config.baseUnit) || 1);
    const tableMax = Math.max(1, Number(config.tableMax) || 1000);
    const mult = this._getCurrentUnits(config);

    let rawBets = [];

    switch (config.strategyId) {
      case 'romanovsky': {
        const d1 = OUTSIDE_BETS.DOZ_1(); d1.amount = 3 * unit * mult;
        const d2 = OUTSIDE_BETS.DOZ_2(); d2.amount = 3 * unit * mult;
        const c1 = makeCornerBet([25, 26, 28, 29], 1 * unit * mult);
        const c2 = makeCornerBet([32, 33, 35, 36], 1 * unit * mult);
        rawBets = [d1, d2, c1, c2];
        break;
      }
      case 'james_bond': {
        const hi = OUTSIDE_BETS.HIGH(); hi.amount = 14 * unit * mult;
        const six = makeSixLineBet([13, 14, 15, 16, 17, 18], 5 * unit * mult);
        const zero = makeStraightBet(0, 1 * unit * mult);
        rawBets = [hi, six, zero];
        break;
      }
      case 'double_dozen': {
        const d1 = OUTSIDE_BETS.DOZ_1(); d1.amount = 1 * unit * mult;
        const d2 = OUTSIDE_BETS.DOZ_2(); d2.amount = 1 * unit * mult;
        rawBets = [d1, d2];
        break;
      }
      case 'custom_felt': {
        if (!customPattern || customPattern.length === 0) {
          rawBets = [];
        } else {
          rawBets = customPattern.map((b) => ({
            ...b,
            numbers: [...b.numbers],
            amount: Math.round(b.amount * mult * 100) / 100
          }));
        }
        break;
      }
      default: {
        // Even-money target strategies
        const targetFactory = OUTSIDE_BETS[config.evenTarget] || OUTSIDE_BETS.RED;
        const bet = targetFactory();
        bet.amount = unit * mult;
        rawBets = [bet];
        break;
      }
    }

    // Enforce Table Max & Bankroll limits
    let totalRaw = rawBets.reduce((acc, b) => acc + b.amount, 0);
    let cappedByMax = false;
    let cappedByBankroll = false;

    if (totalRaw > tableMax && totalRaw > 0) {
      const ratio = tableMax / totalRaw;
      rawBets = rawBets.map((b) => ({ ...b, amount: Math.max(1, Math.floor(b.amount * ratio)) }));
      totalRaw = rawBets.reduce((acc, b) => acc + b.amount, 0);
      if (totalRaw > tableMax) {
        // Trim excess from largest bet if floor pushed slightly over
        rawBets[0].amount = Math.max(0, rawBets[0].amount - (totalRaw - tableMax));
        totalRaw = rawBets.reduce((acc, b) => acc + b.amount, 0);
      }
      cappedByMax = true;
    }

    if (totalRaw > bankroll && bankroll > 0 && totalRaw > 0) {
      const ratio = bankroll / totalRaw;
      rawBets = rawBets
        .map((b) => ({ ...b, amount: Math.floor(b.amount * ratio) }))
        .filter((b) => b.amount > 0);
      totalRaw = rawBets.reduce((acc, b) => acc + b.amount, 0);
      cappedByBankroll = true;
    } else if (bankroll <= 0) {
      rawBets = [];
      totalRaw = 0;
    }

    return {
      bets: rawBets,
      totalStake: totalRaw,
      units: mult,
      cappedByMax,
      cappedByBankroll,
      stateText: this._describeState(config, mult)
    };
  }

  _describeState(config, mult) {
    if (config.strategyId === 'labouchere' && config.afterLoss === 'default' && config.afterWin === 'default') {
      return `Seq: [${this.labList.join('-')}]`;
    }
    if (config.strategyId === 'oscars_grind' && config.afterLoss === 'default' && config.afterWin === 'default') {
      return `Cycle P&L: ${this.oscarProfit >= 0 ? '+' : ''}${this.oscarProfit}u`;
    }
    if (mult > 1) return `Step: ${mult}×`;
    return 'Base: 1×';
  }

  /**
   * Update progression after spin resolution.
   */
  recordOutcome(netProfit, totalStake, config) {
    if (totalStake <= 0) return;
    const strat = STRATEGIES[config.strategyId];
    const unit = Math.max(1, Number(config.baseUnit) || 1);
    const isWin = netProfit > 0;
    const isLoss = netProfit < 0;
    // Note: if netProfit === 0 (push), leave progression unchanged

    if (!isWin && !isLoss) return;

    const rule = isLoss
      ? (config.afterLoss === 'default' ? strat.defaultAfterLoss : config.afterLoss)
      : (config.afterWin === 'default' ? strat.defaultAfterWin : config.afterWin);

    if (rule === 'labouchere') {
      const betUnits = Math.max(1, Math.round(totalStake / unit));
      if (isWin) {
        this.labList.shift();
        if (this.labList.length > 0) this.labList.pop();
        if (this.labList.length === 0) this.labList = [1, 2, 3, 4];
      } else {
        this.labList.push(betUnits);
      }
      return;
    }

    if (rule === 'oscar') {
      // Oscar's Grind win handler
      this.oscarProfit += netProfit / unit;
      if (this.oscarProfit >= 1) {
        this.oscarProfit = 0;
        this.oscarUnits = 1;
      } else {
        const needed = Math.ceil(1 - this.oscarProfit);
        this.oscarUnits = Math.min(this.oscarUnits + 1, Math.max(1, needed));
      }
      return;
    }

    if (config.strategyId === 'oscars_grind' && isLoss && rule === 'same') {
      this.oscarProfit += netProfit / unit;
      return;
    }

    if (rule === 'fib') {
      this.fibIndex = Math.min(this.fibIndex + 1, FIB_SEQ.length - 1);
      return;
    }
    if (rule === 'fib_back2') {
      this.fibIndex = Math.max(0, this.fibIndex - 2);
      return;
    }

    switch (rule) {
      case 'reset':
        this.multiplier = 1;
        this.fibIndex = 0;
        this.winStreak = 0;
        break;
      case 'x2':
        if (isWin && config.strategyId === 'reverse_martingale' && config.afterWin === 'default') {
          this.winStreak += 1;
          if (this.winStreak >= 3) {
            this.multiplier = 1;
            this.winStreak = 0;
          } else {
            this.multiplier *= 2;
          }
        } else {
          this.multiplier = Math.round(this.multiplier * 2 * 100) / 100;
        }
        break;
      case 'x1.5':
        this.multiplier = Math.max(1, Math.round(this.multiplier * 1.5 * 100) / 100);
        break;
      case 'x3':
        this.multiplier = Math.round(this.multiplier * 3 * 100) / 100;
        break;
      case 'plus1':
        this.multiplier += 1;
        break;
      case 'minus1':
        this.multiplier = Math.max(1, this.multiplier - 1);
        break;
      case 'same':
      default:
        break;
    }
  }
}

/**
 * Run a fast N-spin batch on a standalone tracker (or existing session tracker).
 */
export function runFastSpins({
  count,
  variantId,
  config,
  startBankroll,
  initialBankroll,
  tracker,
  customPattern
}) {
  let bankroll = initialBankroll;
  const results = [];

  const stopWinTarget = config.stopWin ? startBankroll + Number(config.stopWin) : null;
  const stopLossFloor = config.stopLoss ? Math.max(0, startBankroll - Number(config.stopLoss)) : null;

  let stopReason = null;

  for (let i = 0; i < count; i++) {
    if (bankroll <= 0) {
      stopReason = 'Busted ($0 bankroll)';
      break;
    }
    if (stopWinTarget !== null && bankroll >= stopWinTarget) {
      stopReason = 'Stop-Win target reached';
      break;
    }
    if (stopLossFloor !== null && bankroll <= stopLossFloor) {
      stopReason = 'Stop-Loss drawdown hit';
      break;
    }

    const plan = tracker.buildNextBets(config, bankroll, customPattern);
    if (plan.totalStake <= 0 || plan.bets.length === 0) {
      stopReason = 'No valid bet (empty custom felt or insufficient funds)';
      break;
    }

    const outcome = randomPocket(variantId);
    const evalRes = evaluateBets(plan.bets, outcome, variantId);
    bankroll = Math.round((bankroll + evalRes.netProfit) * 100) / 100;
    tracker.recordOutcome(evalRes.netProfit, evalRes.totalStake, config);

    results.push({
      outcome,
      stake: evalRes.totalStake,
      payoutReturn: evalRes.totalReturn,
      netProfit: evalRes.netProfit,
      bankroll
    });
  }

  return { results, finalBankroll: bankroll, stopReason };
}

/**
 * Run 50 x 250 Monte Carlo independent simulations.
 */
export function runMonteCarlo({
  runs = 50,
  spinsPerRun = 250,
  variantId,
  config,
  customPattern
}) {
  const startBankroll = Math.max(10, Number(config.startBankroll) || 5000);
  const paths = [];
  const finals = [];
  let bustedCount = 0;
  let profitCount = 0;

  for (let r = 0; r < runs; r++) {
    const tracker = new StrategyTracker();
    const path = [startBankroll];
    const sim = runFastSpins({
      count: spinsPerRun,
      variantId,
      config,
      startBankroll,
      initialBankroll: startBankroll,
      tracker,
      customPattern
    });

    for (const step of sim.results) {
      path.push(step.bankroll);
    }
    // Pad path if stopped early so percentile lines align across spin axis
    const lastVal = path[path.length - 1];
    while (path.length <= spinsPerRun) {
      path.push(lastVal);
    }

    if (lastVal <= 0) bustedCount++;
    if (lastVal > startBankroll) profitCount++;

    paths.push(path);
    finals.push(lastVal);
  }

  // Compute mean trajectory across all runs per spin
  const meanPath = [];
  for (let s = 0; s <= spinsPerRun; s++) {
    let sum = 0;
    for (let r = 0; r < runs; r++) sum += paths[r][s];
    meanPath.push(sum / runs);
  }

  const sortedFinals = [...finals].sort((a, b) => a - b);
  const meanFinal = finals.reduce((a, b) => a + b, 0) / runs;
  const medianFinal = sortedFinals[Math.floor(runs / 2)];
  const bestFinal = sortedFinals[sortedFinals.length - 1];
  const worstFinal = sortedFinals[0];

  return {
    runs,
    spinsPerRun,
    startBankroll,
    paths,
    meanPath,
    meanFinal,
    medianFinal,
    bestFinal,
    worstFinal,
    bustRate: (bustedCount / runs) * 100,
    profitRate: (profitCount / runs) * 100
  };
}
