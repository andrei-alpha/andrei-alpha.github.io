import {
  VARIANTS,
  getPocketColor,
  randomPocket,
  evaluateBets,
  getCallBetPattern,
  formatMoney
} from './roulette-engine.js';
import { RouletteWheelRenderer } from './wheel-canvas.js';
import { FeltBoard } from './felt-board.js';
import {
  STRATEGIES,
  StrategyTracker,
  runFastSpins,
  runMonteCarlo
} from './strategies.js';
import { TrajectoryChart } from './chart-canvas.js';
import { SoundEffects } from './sound.js';

const SPEED_MODES = [
  { id: 'normal', label: 'Normal Spin' },
  { id: 'fast', label: 'Fast Spin' },
  { id: 'instant', label: 'Instant' }
];

class RouletteLabApp {
  constructor() {
    this.variantId = 'european';
    this.speedIndex = 0;
    this.selectedChip = 25;

    this.startBankroll = 5000;
    this.bankroll = 5000;
    this.currentBets = new Map();
    this.undoStack = [];
    this.lastSpinBets = null;
    this.customFeltPattern = [];

    this.spinHistory = [];
    this.trajectory = [5000];
    this.totalWagered = 0;
    this.winningSpins = 0;
    this.peakBankroll = 5000;
    this.maxDrawdown = 0;
    this.pocketCounts = new Map();

    this.tracker = new StrategyTracker();
    this.autoSpinning = false;
    this.isSpinning = false;
    this.mcResult = null;

    this.sound = new SoundEffects();
    this._cacheElements();
    this._initComponents();
    this._bindEvents();
    this._updateStrategyUI();
    this._updateAllDisplays();
  }

  _cacheElements() {
    this.el = {
      variantSubtitle: document.getElementById('variant-subtitle'),
      variantTabs: document.querySelectorAll('.variant-tab'),
      statBankroll: document.getElementById('stat-bankroll'),
      statStake: document.getElementById('stat-stake'),
      statPnl: document.getElementById('stat-pnl'),
      statSpins: document.getElementById('stat-spins'),

      btnSpeed: document.getElementById('btn-speed'),
      speedLabel: document.getElementById('speed-label'),
      btnSound: document.getElementById('btn-sound'),
      iconSoundOn: document.getElementById('icon-sound-on'),
      iconSoundOff: document.getElementById('icon-sound-off'),
      btnRules: document.getElementById('btn-rules'),
      btnReset: document.getElementById('btn-reset'),

      recentNumbers: document.getElementById('recent-numbers'),
      wheelCanvas: document.getElementById('wheel-canvas'),
      resultBadge: document.getElementById('result-badge'),
      resultHeadline: document.getElementById('result-headline'),
      resultSub: document.getElementById('result-sub'),
      btnHistoryToggle: document.getElementById('btn-history-toggle'),
      spinLog: document.getElementById('spin-log'),

      hoverReadout: document.getElementById('hover-readout'),
      feltBoard: document.getElementById('felt-board'),
      callButtons: document.querySelectorAll('.call-btn[data-call]'),
      btnRacetrackToggle: document.getElementById('btn-racetrack-toggle'),
      racetrackPanel: document.getElementById('racetrack-panel'),
      racetrackPockets: document.getElementById('racetrack-pockets'),
      neighbourBtns: document.querySelectorAll('.nb-btn'),
      neighbourCountLabel: document.getElementById('neighbour-count-label'),

      chipButtons: document.querySelectorAll('.chip'),
      btnUndo: document.getElementById('btn-undo'),
      btnRebet: document.getElementById('btn-rebet'),
      btnDouble: document.getElementById('btn-double'),
      btnClear: document.getElementById('btn-clear'),
      btnSpin: document.getElementById('btn-spin'),

      metricWinrate: document.getElementById('metric-winrate'),
      metricWagered: document.getElementById('metric-wagered'),
      metricPeak: document.getElementById('metric-peak'),
      metricDrawdown: document.getElementById('metric-drawdown'),
      metricHotCold: document.getElementById('metric-hotcold'),

      selectStrategy: document.getElementById('select-strategy'),
      selectEvenTarget: document.getElementById('select-even-target'),
      selectAfterLoss: document.getElementById('select-after-loss'),
      selectAfterWin: document.getElementById('select-after-win'),
      strategyDesc: document.getElementById('strategy-desc'),
      inputBaseUnit: document.getElementById('input-base-unit'),
      inputStartBankroll: document.getElementById('input-start-bankroll'),
      selectTableMax: document.getElementById('select-table-max'),
      customMaxField: document.getElementById('custom-max-field'),
      inputCustomMax: document.getElementById('input-custom-max'),
      inputStopWin: document.getElementById('input-stop-win'),
      inputStopLoss: document.getElementById('input-stop-loss'),
      maxBetBadge: document.getElementById('max-bet-badge'),
      nextStrategyBet: document.getElementById('next-strategy-bet'),
      progStateLabel: document.getElementById('prog-state-label'),

      btnPlaceStrategy: document.getElementById('btn-place-strategy'),
      btnAutoSpin: document.getElementById('btn-auto-spin'),
      autoSpinLabel: document.getElementById('auto-spin-label'),
      btnSim100: document.getElementById('btn-sim-100'),
      btnSim1000: document.getElementById('btn-sim-1000'),
      btnMonteCarlo: document.getElementById('btn-monte-carlo'),

      chartCanvas: document.getElementById('chart-canvas'),
      chartTooltip: document.getElementById('chart-tooltip'),
      btnClearMc: document.getElementById('btn-clear-mc'),
      btnExportCsv: document.getElementById('btn-export-csv'),
      mcSummary: document.getElementById('mc-summary'),
      mcMean: document.getElementById('mc-mean'),
      mcProfitRate: document.getElementById('mc-profit-rate'),
      mcBustRate: document.getElementById('mc-bust-rate'),
      mcMedianBest: document.getElementById('mc-median-best'),

      rulesModal: document.getElementById('rules-modal'),
      btnCloseModal: document.getElementById('btn-close-modal')
    };
  }

  _initComponents() {
    this.wheel = new RouletteWheelRenderer(this.el.wheelCanvas);
    this.felt = new FeltBoard({
      boardEl: this.el.feltBoard,
      hoverReadoutEl: this.el.hoverReadout,
      racetrackEl: this.el.racetrackPockets,
      onPlaceBet: (betTemplate) => this._handleAddChip(betTemplate, this.selectedChip),
      onRemoveBet: (betTemplate) => this._handleRemoveChip(betTemplate)
    });
    this.chart = new TrajectoryChart(this.el.chartCanvas, this.el.chartTooltip);
  }

  _bindEvents() {
    // Variant tabs
    this.el.variantTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (this.isSpinning || this.autoSpinning) return;
        this.variantId = tab.dataset.variant;
        this.el.variantTabs.forEach((t) => {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        this.el.variantSubtitle.textContent = VARIANTS[this.variantId].subtitle;
        this.wheel.setVariant(this.variantId);
        this.felt.setVariant(this.variantId);
        this._clearBets(false);
        this.lastSpinBets = null;
        this._updateAllDisplays();
      });
    });

    // Speed toggle
    this.el.btnSpeed.addEventListener('click', () => {
      this.speedIndex = (this.speedIndex + 1) % SPEED_MODES.length;
      this.el.speedLabel.textContent = SPEED_MODES[this.speedIndex].label;
    });

    // Sound toggle
    this.el.btnSound.addEventListener('click', () => {
      this.sound.enabled = !this.sound.enabled;
      this.el.iconSoundOn.classList.toggle('hidden', !this.sound.enabled);
      this.el.iconSoundOff.classList.toggle('hidden', this.sound.enabled);
    });

    // Rules modal
    this.el.btnRules.addEventListener('click', () => this.el.rulesModal.classList.remove('hidden'));
    this.el.btnCloseModal.addEventListener('click', () => this.el.rulesModal.classList.add('hidden'));
    this.el.rulesModal.addEventListener('click', (e) => {
      if (e.target === this.el.rulesModal) this.el.rulesModal.classList.add('hidden');
    });

    // Reset session
    this.el.btnReset.addEventListener('click', () => this._resetSession());

    // Spin log toggle
    this.el.btnHistoryToggle.addEventListener('click', () => {
      const hidden = this.el.spinLog.classList.toggle('hidden');
      this.el.btnHistoryToggle.textContent = hidden ? '+' : '−';
    });

    // Chip selection
    this.el.chipButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedChip = Number(btn.dataset.value);
        this.el.chipButtons.forEach((b) => b.classList.toggle('active', b === btn));
        this.sound.playChip();
      });
    });

    // Call bets
    this.el.callButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.isSpinning) return;
        const pattern = getCallBetPattern(btn.dataset.call);
        const totalUnits = pattern.reduce((acc, p) => acc + p.units, 0);
        const needed = totalUnits * this.selectedChip;
        const currentStake = this._getTableStake();
        if (currentStake + needed > this.bankroll) {
          this._flashMessage('Insufficient bankroll for call bet', `Need ${formatMoney(needed)} available.`);
          return;
        }
        this._pushUndo();
        for (const item of pattern) {
          this._mutateBet(item.bet, item.units * this.selectedChip);
        }
        this.sound.playChip();
        this._captureCustomPattern();
        this._updateAllDisplays();
      });
    });

    // Racetrack toggle & neighbours
    this.el.btnRacetrackToggle.addEventListener('click', () => {
      const hidden = this.el.racetrackPanel.classList.toggle('hidden');
      this.el.btnRacetrackToggle.classList.toggle('active', !hidden);
    });

    this.el.neighbourBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = Number(btn.dataset.nb);
        this.felt.setNeighbourCount(n);
        this.el.neighbourCountLabel.textContent = String(n);
        this.el.neighbourBtns.forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    // Table actions
    this.el.btnUndo.addEventListener('click', () => this._undo());
    this.el.btnRebet.addEventListener('click', () => this._rebet());
    this.el.btnDouble.addEventListener('click', () => this._doubleBets());
    this.el.btnClear.addEventListener('click', () => this._clearBets(true));
    this.el.btnSpin.addEventListener('click', () => this._spinManual());

    // Keyboard shortcut: Space to spin
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        if (!this.isSpinning && !this.autoSpinning) {
          this._spinManual();
        }
      }
    });

    // Strategy Lab inputs
    const strategyInputs = [
      this.el.selectStrategy,
      this.el.selectEvenTarget,
      this.el.selectAfterLoss,
      this.el.selectAfterWin,
      this.el.inputBaseUnit,
      this.el.selectTableMax,
      this.el.inputCustomMax
    ];

    strategyInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (input === this.el.selectStrategy) {
          this.tracker.reset();
        }
        this._updateStrategyUI();
      });
      input.addEventListener('input', () => this._updateStrategyUI());
    });

    this.el.inputStartBankroll.addEventListener('change', () => {
      if (this.spinHistory.length === 0) {
        this._resetSession();
      }
    });

    this.el.btnPlaceStrategy.addEventListener('click', () => this._placeStrategyOnFelt());
    this.el.btnAutoSpin.addEventListener('click', () => this._toggleAutoSpin());
    this.el.btnSim100.addEventListener('click', () => this._runInstantBatch(100));
    this.el.btnSim1000.addEventListener('click', () => this._runInstantBatch(1000));
    this.el.btnMonteCarlo.addEventListener('click', () => this._runMonteCarloLab());
    this.el.btnClearMc.addEventListener('click', () => this._exitMonteCarloView());
    this.el.btnExportCsv.addEventListener('click', () => this._exportCSV());
  }

  _getConfig() {
    const tableMax = this.el.selectTableMax.value === 'custom'
      ? Math.max(10, Number(this.el.inputCustomMax.value) || 1000)
      : Number(this.el.selectTableMax.value);

    return {
      strategyId: this.el.selectStrategy.value,
      evenTarget: this.el.selectEvenTarget.value,
      afterLoss: this.el.selectAfterLoss.value,
      afterWin: this.el.selectAfterWin.value,
      baseUnit: Math.max(1, Number(this.el.inputBaseUnit.value) || 10),
      startBankroll: Math.max(10, Number(this.el.inputStartBankroll.value) || 5000),
      tableMax,
      stopWin: this.el.inputStopWin.value ? Number(this.el.inputStopWin.value) : null,
      stopLoss: this.el.inputStopLoss.value ? Number(this.el.inputStopLoss.value) : null
    };
  }

  _updateStrategyUI() {
    const config = this._getConfig();
    const strat = STRATEGIES[config.strategyId];

    this.el.selectEvenTarget.disabled = !strat.usesEvenTarget;
    this.el.strategyDesc.textContent = strat.description;

    this.el.customMaxField.classList.toggle('hidden', this.el.selectTableMax.value !== 'custom');
    this.el.maxBetBadge.textContent = `Max Bet: ${formatMoney(config.tableMax)}`;

    const plan = this.tracker.buildNextBets(config, Math.max(this.bankroll, config.baseUnit * 100), this.customFeltPattern);
    if (config.strategyId === 'custom_felt' && this.customFeltPattern.length === 0) {
      this.el.nextStrategyBet.textContent = 'Place chips first';
      this.el.progStateLabel.textContent = 'Empty felt pattern';
    } else {
      this.el.nextStrategyBet.textContent = formatMoney(plan.totalStake);
      this.el.progStateLabel.textContent = plan.cappedByMax ? `${plan.stateText} (Capped at Max)` : plan.stateText;
    }
  }

  _getTableStake() {
    let sum = 0;
    for (const bet of this.currentBets.values()) sum += bet.amount;
    return sum;
  }

  _cloneBetsMap(map) {
    const copy = new Map();
    for (const [k, v] of map.entries()) {
      copy.set(k, { ...v, numbers: [...v.numbers] });
    }
    return copy;
  }

  _pushUndo() {
    this.undoStack.push(this._cloneBetsMap(this.currentBets));
    if (this.undoStack.length > 40) this.undoStack.shift();
  }

  _mutateBet(betTemplate, deltaAmount) {
    const existing = this.currentBets.get(betTemplate.id);
    if (existing) {
      const nextAmt = existing.amount + deltaAmount;
      if (nextAmt <= 0) this.currentBets.delete(betTemplate.id);
      else existing.amount = nextAmt;
    } else if (deltaAmount > 0) {
      this.currentBets.set(betTemplate.id, {
        ...betTemplate,
        numbers: [...betTemplate.numbers],
        amount: deltaAmount
      });
    }
  }

  _captureCustomPattern() {
    if (this.currentBets.size > 0) {
      this.customFeltPattern = Array.from(this.currentBets.values()).map((b) => ({
        ...b,
        numbers: [...b.numbers]
      }));
      if (this.el.selectStrategy.value === 'custom_felt') {
        this._updateStrategyUI();
      }
    }
  }

  _handleAddChip(betTemplate, chipValue) {
    if (this.isSpinning) return;
    const currentStake = this._getTableStake();
    if (currentStake + chipValue > this.bankroll) {
      this._flashMessage('Insufficient Bankroll', `Cannot wager more than ${formatMoney(this.bankroll)}.`);
      return;
    }
    this._pushUndo();
    this._mutateBet(betTemplate, chipValue);
    this.sound.playChip();
    this._captureCustomPattern();
    this._updateAllDisplays();
  }

  _handleRemoveChip(betTemplate) {
    if (this.isSpinning || !this.currentBets.has(betTemplate.id)) return;
    this._pushUndo();
    const existing = this.currentBets.get(betTemplate.id);
    const removeAmt = Math.min(existing.amount, this.selectedChip);
    this._mutateBet(betTemplate, -removeAmt);
    this.sound.playChip();
    this._captureCustomPattern();
    this._updateAllDisplays();
  }

  _undo() {
    if (this.isSpinning || this.undoStack.length === 0) return;
    this.currentBets = this.undoStack.pop();
    this.sound.playChip();
    this._updateAllDisplays();
  }

  _rebet() {
    if (this.isSpinning || !this.lastSpinBets || this.lastSpinBets.size === 0) return;
    let needed = 0;
    for (const b of this.lastSpinBets.values()) needed += b.amount;
    if (needed > this.bankroll) {
      this._flashMessage('Insufficient Bankroll', `Rebet requires ${formatMoney(needed)}.`);
      return;
    }
    this._pushUndo();
    this.currentBets = this._cloneBetsMap(this.lastSpinBets);
    this.sound.playChip();
    this._updateAllDisplays();
  }

  _doubleBets() {
    if (this.isSpinning || this.currentBets.size === 0) return;
    const currentStake = this._getTableStake();
    if (currentStake * 2 > this.bankroll) {
      this._flashMessage('Insufficient Bankroll', `Doubling requires ${formatMoney(currentStake * 2)}.`);
      return;
    }
    this._pushUndo();
    for (const bet of this.currentBets.values()) {
      bet.amount *= 2;
    }
    this.sound.playChip();
    this._captureCustomPattern();
    this._updateAllDisplays();
  }

  _clearBets(pushHistory = true) {
    if (this.isSpinning) return;
    if (pushHistory && this.currentBets.size > 0) this._pushUndo();
    this.currentBets.clear();
    this._updateAllDisplays();
  }

  _placeStrategyOnFelt() {
    if (this.isSpinning) return;
    const config = this._getConfig();
    if (config.strategyId === 'custom_felt' && this.customFeltPattern.length === 0) {
      this._flashMessage('Empty Felt Pattern', 'Place chips on the felt first to use Custom Felt Layout.');
      return;
    }
    const plan = this.tracker.buildNextBets(config, this.bankroll, this.customFeltPattern);
    if (plan.totalStake <= 0 || plan.bets.length === 0) {
      this._flashMessage('Cannot Place Bet', 'Bankroll is too low for the next strategy bet.');
      return;
    }
    this._pushUndo();
    this.currentBets.clear();
    for (const b of plan.bets) {
      this.currentBets.set(b.id, { ...b, numbers: [...b.numbers] });
    }
    this.sound.playChip();
    this._updateAllDisplays();
    this._updateStrategyUI();
  }

  async _spinManual() {
    if (this.isSpinning) return;

    // Convenience: if felt is empty and we had a previous bet? No, prompt user or spin empty only if bets exist.
    const stake = this._getTableStake();
    if (stake <= 0) {
      this._flashMessage('No Chips Placed', 'Click the felt or click "Place on Felt" in the Strategy Lab.');
      return;
    }
    if (stake > this.bankroll) {
      this._flashMessage('Insufficient Bankroll', `Table stake exceeds ${formatMoney(this.bankroll)}.`);
      return;
    }

    const betsList = Array.from(this.currentBets.values());
    this.lastSpinBets = this._cloneBetsMap(this.currentBets);
    await this._executeSingleAnimatedSpin(betsList, false);
    this.currentBets.clear();
    this.undoStack = [];
    this._updateAllDisplays();
  }

  async _executeSingleAnimatedSpin(betsList, updateTracker = false) {
    this.isSpinning = true;
    this._setInteractiveDisabled(true);

    const outcome = randomPocket(this.variantId);
    const speedMode = SPEED_MODES[this.speedIndex].id;

    await this.wheel.spinTo(outcome, speedMode, () => this.sound.playTick());
    this.felt.pulseWinner(outcome);

    const res = evaluateBets(betsList, outcome, this.variantId);
    this._recordSpinResult(outcome, res);

    if (updateTracker) {
      this.tracker.recordOutcome(res.netProfit, res.totalStake, this._getConfig());
    }

    if (res.netProfit > 0) this.sound.playWin();
    else if (res.netProfit < 0) this.sound.playLoss();

    this.isSpinning = false;
    this._setInteractiveDisabled(false);
    this._updateStrategyUI();
    this._updateAllDisplays();
    return res;
  }

  _recordSpinResult(outcome, res) {
    this.bankroll = Math.round((this.bankroll + res.netProfit) * 100) / 100;
    this.totalWagered += res.totalStake;
    if (res.netProfit > 0) this.winningSpins++;
    if (this.bankroll > this.peakBankroll) this.peakBankroll = this.bankroll;
    const dd = this.peakBankroll - this.bankroll;
    if (dd > this.maxDrawdown) this.maxDrawdown = dd;

    const pKey = String(outcome);
    this.pocketCounts.set(pKey, (this.pocketCounts.get(pKey) || 0) + 1);

    const entry = {
      spin: this.spinHistory.length + 1,
      outcome,
      color: getPocketColor(outcome),
      stake: res.totalStake,
      totalReturn: res.totalReturn,
      netProfit: res.netProfit,
      laPartageSaved: res.laPartageSaved,
      bankroll: this.bankroll
    };
    this.spinHistory.push(entry);
    this.trajectory.push(this.bankroll);

    // Update Result Card
    this.el.resultBadge.className = `result-badge ${entry.color}`;
    this.el.resultBadge.textContent = String(outcome);
    const colorName = entry.color.charAt(0).toUpperCase() + entry.color.slice(1);
    if (res.netProfit > 0) {
      this.el.resultHeadline.textContent = `Hit ${outcome} (${colorName}) • Won ${formatMoney(res.netProfit, true)}`;
    } else if (res.netProfit === 0) {
      this.el.resultHeadline.textContent = `Hit ${outcome} (${colorName}) • Push ($0)`;
    } else {
      this.el.resultHeadline.textContent = `Hit ${outcome} (${colorName}) • ${formatMoney(res.netProfit, true)}`;
    }
    const lpNote = res.laPartageSaved > 0 ? ` (La Partage saved ${formatMoney(res.laPartageSaved)})` : '';
    this.el.resultSub.textContent = `Stake ${formatMoney(res.totalStake)} → Return ${formatMoney(res.totalReturn)}${lpNote}`;
  }

  async _toggleAutoSpin() {
    if (this.autoSpinning) {
      this.autoSpinning = false;
      this.el.btnAutoSpin.classList.remove('running');
      this.el.autoSpinLabel.textContent = 'Live Auto-Spin';
      return;
    }

    const config = this._getConfig();
    if (config.strategyId === 'custom_felt' && this.customFeltPattern.length === 0) {
      this._flashMessage('Empty Felt Pattern', 'Place chips on the felt first to auto-spin Custom Felt.');
      return;
    }

    this.autoSpinning = true;
    this.el.btnAutoSpin.classList.add('running');
    this.el.autoSpinLabel.textContent = 'Stop Auto-Spin';
    this.felt.clearWinnerPulse();
    this._exitMonteCarloView(false);

    const stopWinTarget = config.stopWin ? this.startBankroll + config.stopWin : null;
    const stopLossFloor = config.stopLoss ? Math.max(0, this.startBankroll - config.stopLoss) : null;

    while (this.autoSpinning) {
      const liveConfig = this._getConfig();
      if (this.bankroll <= 0) {
        this._flashMessage('Auto-Spin Stopped', 'Bankroll busted ($0).');
        break;
      }
      if (stopWinTarget !== null && this.bankroll >= stopWinTarget) {
        this._flashMessage('Stop-Win Reached', `Bankroll reached ${formatMoney(this.bankroll)}.`);
        break;
      }
      if (stopLossFloor !== null && this.bankroll <= stopLossFloor) {
        this._flashMessage('Stop-Loss Hit', `Bankroll dropped to ${formatMoney(this.bankroll)}.`);
        break;
      }

      const plan = this.tracker.buildNextBets(liveConfig, this.bankroll, this.customFeltPattern);
      if (plan.totalStake <= 0 || plan.bets.length === 0) {
        this._flashMessage('Auto-Spin Stopped', 'No valid stake for next spin.');
        break;
      }

      this.currentBets.clear();
      for (const b of plan.bets) {
        this.currentBets.set(b.id, { ...b, numbers: [...b.numbers] });
      }
      this.felt.syncChips(this.currentBets);
      this._updateHeaderStats();

      await this._executeSingleAnimatedSpin(plan.bets, true);

      if (!this.autoSpinning) break;
      await new Promise((r) => setTimeout(r, SPEED_MODES[this.speedIndex].id === 'instant' ? 40 : 260));
    }

    this.autoSpinning = false;
    this.currentBets.clear();
    this.el.btnAutoSpin.classList.remove('running');
    this.el.autoSpinLabel.textContent = 'Live Auto-Spin';
    this._updateAllDisplays();
  }

  _runInstantBatch(count) {
    if (this.isSpinning || this.autoSpinning) return;
    const config = this._getConfig();
    if (config.strategyId === 'custom_felt' && this.customFeltPattern.length === 0) {
      this._flashMessage('Empty Felt Pattern', 'Place chips on the felt first to simulate Custom Felt.');
      return;
    }

    this.felt.clearWinnerPulse();
    this._exitMonteCarloView(false);

    const sim = runFastSpins({
      count,
      variantId: this.variantId,
      config,
      startBankroll: this.startBankroll,
      initialBankroll: this.bankroll,
      tracker: this.tracker,
      customPattern: this.customFeltPattern
    });

    for (const step of sim.results) {
      this._recordSpinResult(step.outcome, {
        totalStake: step.stake,
        totalReturn: step.payoutReturn,
        netProfit: step.netProfit,
        laPartageSaved: 0
      });
    }

    if (sim.results.length > 0) {
      const last = sim.results[sim.results.length - 1];
      this.wheel.spinTo(last.outcome, 'instant');
      this.felt.pulseWinner(last.outcome);
    }

    if (sim.stopReason) {
      this._flashMessage(`Stopped after ${sim.results.length} spins`, sim.stopReason);
    } else {
      this.el.resultHeadline.textContent = `Simulated +${sim.results.length} Spins`;
      this.el.resultSub.textContent = `Current Bankroll: ${formatMoney(this.bankroll)} (${formatMoney(this.bankroll - this.startBankroll, true)})`;
    }

    this._updateStrategyUI();
    this._updateAllDisplays();
  }

  _runMonteCarloLab() {
    if (this.isSpinning || this.autoSpinning) return;
    const config = this._getConfig();
    if (config.strategyId === 'custom_felt' && this.customFeltPattern.length === 0) {
      this._flashMessage('Empty Felt Pattern', 'Place chips on the felt first to run Monte Carlo on Custom Felt.');
      return;
    }

    const mc = runMonteCarlo({
      runs: 50,
      spinsPerRun: 250,
      variantId: this.variantId,
      config,
      customPattern: this.customFeltPattern
    });

    this.mcResult = mc;
    this.chart.setMonteCarloData(mc);
    this.el.mcSummary.classList.remove('hidden');
    this.el.btnClearMc.classList.remove('hidden');

    this.el.mcMean.textContent = formatMoney(mc.meanFinal);
    this.el.mcProfitRate.textContent = `${mc.profitRate.toFixed(0)}%`;
    this.el.mcBustRate.textContent = `${mc.bustRate.toFixed(0)}%`;
    this.el.mcMedianBest.textContent = `${formatMoney(mc.medianFinal)} / ${formatMoney(mc.bestFinal)}`;
  }

  _exitMonteCarloView(redraw = true) {
    this.mcResult = null;
    this.el.mcSummary.classList.add('hidden');
    this.el.btnClearMc.classList.add('hidden');
    if (redraw) {
      this.chart.setSessionData(this.trajectory, this.startBankroll);
    }
  }

  _resetSession() {
    this.autoSpinning = false;
    this.el.btnAutoSpin.classList.remove('running');
    this.el.autoSpinLabel.textContent = 'Live Auto-Spin';

    const newStart = Math.max(10, Number(this.el.inputStartBankroll.value) || 5000);
    this.startBankroll = newStart;
    this.bankroll = newStart;
    this.currentBets.clear();
    this.undoStack = [];
    this.lastSpinBets = null;
    this.spinHistory = [];
    this.trajectory = [newStart];
    this.totalWagered = 0;
    this.winningSpins = 0;
    this.peakBankroll = newStart;
    this.maxDrawdown = 0;
    this.pocketCounts.clear();
    this.tracker.reset();

    this.el.resultBadge.className = 'result-badge green';
    this.el.resultBadge.textContent = '0';
    this.el.resultHeadline.textContent = 'Session Reset';
    this.el.resultSub.textContent = `Ready with ${formatMoney(newStart)} bankroll.`;

    this.felt.clearWinnerPulse();
    this._exitMonteCarloView(false);
    this._updateStrategyUI();
    this._updateAllDisplays();
  }

  _flashMessage(headline, sub) {
    this.el.resultHeadline.textContent = headline;
    this.el.resultSub.textContent = sub;
  }

  _setInteractiveDisabled(disabled) {
    this.el.btnSpin.disabled = disabled;
    if (!disabled) {
      this._updateActionButtons();
    } else {
      this.el.btnUndo.disabled = true;
      this.el.btnRebet.disabled = true;
      this.el.btnDouble.disabled = true;
      this.el.btnClear.disabled = true;
    }
  }

  _updateActionButtons() {
    const hasBets = this.currentBets.size > 0;
    this.el.btnUndo.disabled = this.undoStack.length === 0;
    this.el.btnRebet.disabled = !this.lastSpinBets || this.lastSpinBets.size === 0;
    this.el.btnDouble.disabled = !hasBets;
    this.el.btnClear.disabled = !hasBets;
  }

  _updateHeaderStats() {
    const stake = this._getTableStake();
    const pnl = this.bankroll - this.startBankroll;
    this.el.statBankroll.textContent = formatMoney(this.bankroll);
    this.el.statStake.textContent = formatMoney(stake);
    this.el.statPnl.textContent = formatMoney(pnl, true);
    this.el.statPnl.className = `stat-value ${pnl > 0 ? 'pos' : pnl < 0 ? 'neg' : ''}`;
    this.el.statSpins.textContent = this.spinHistory.length.toLocaleString('en-US');
  }

  _updateAllDisplays() {
    this.felt.syncChips(this.currentBets);
    this._updateHeaderStats();
    this._updateActionButtons();

    // Recent numbers strip (last 22 spins, newest first)
    if (this.spinHistory.length === 0) {
      this.el.recentNumbers.innerHTML =
        '<span class="recent-placeholder">Place chips on the felt or load a strategy to begin spinning.</span>';
      this.el.spinLog.innerHTML = '';
    } else {
      const recent = this.spinHistory.slice(-22).reverse();
      this.el.recentNumbers.innerHTML = recent
        .map((r, i) => `<span class="recent-pill ${r.color}${i === 0 ? ' latest' : ''}">${r.outcome}</span>`)
        .join('');

      const logSlice = this.spinHistory.slice(-30).reverse();
      this.el.spinLog.innerHTML = logSlice
        .map((r) => `<div class="spin-log-row"><span>#${r.spin} • ${r.outcome} (${r.color})</span><span>${formatMoney(r.netProfit, true)}</span></div>`)
        .join('');
    }

    // Analytics strip
    const spins = this.spinHistory.length;
    const winRate = spins ? ((this.winningSpins / spins) * 100).toFixed(1) : '0.0';
    this.el.metricWinrate.textContent = `${winRate}%`;
    this.el.metricWagered.textContent = formatMoney(this.totalWagered);
    this.el.metricPeak.textContent = formatMoney(this.peakBankroll);
    this.el.metricDrawdown.textContent = formatMoney(this.maxDrawdown);

    if (this.pocketCounts.size > 0) {
      let hotKey = null;
      let hotCount = -1;
      for (const [k, c] of this.pocketCounts.entries()) {
        if (c > hotCount) {
          hotCount = c;
          hotKey = k;
        }
      }
      this.el.metricHotCold.textContent = `#${hotKey} (${hotCount}×)`;
    } else {
      this.el.metricHotCold.textContent = '—';
    }

    if (!this.mcResult) {
      this.chart.setSessionData(this.trajectory, this.startBankroll);
    }
  }

  _exportCSV() {
    if (this.mcResult) {
      const rows = ['Spin,Mean_Bankroll,' + this.mcResult.paths.map((_, i) => `Run_${i + 1}`).join(',')];
      for (let s = 0; s <= this.mcResult.spinsPerRun; s++) {
        const vals = this.mcResult.paths.map((p) => p[s].toFixed(2));
        rows.push(`${s},${this.mcResult.meanPath[s].toFixed(2)},${vals.join(',')}`);
      }
      this._downloadFile('roulette-monte-carlo-50x250.csv', rows.join('\n'));
      return;
    }

    const rows = ['Spin,Outcome,Color,Stake,Return,Net_PnL,Bankroll'];
    for (const r of this.spinHistory) {
      rows.push(`${r.spin},${r.outcome},${r.color},${r.stake},${r.totalReturn},${r.netProfit},${r.bankroll}`);
    }
    this._downloadFile('roulette-session-log.csv', rows.join('\n'));
  }

  _downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new RouletteLabApp();
});
