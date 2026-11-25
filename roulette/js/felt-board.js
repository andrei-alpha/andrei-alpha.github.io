import {
  VARIANTS,
  OUTSIDE_BETS,
  getPocketColor,
  makeStraightBet,
  makeSplitBet,
  makeStreetBet,
  makeCornerBet,
  makeTopLineBet,
  makeSixLineBet,
  formatMoney,
  normPocket
} from './roulette-engine.js';

/**
 * Interactive Roulette Felt Board + Chip Renderer + Racetrack Neighbours
 */
export class FeltBoard {
  constructor({ boardEl, hoverReadoutEl, racetrackEl, onPlaceBet, onRemoveBet }) {
    this.boardEl = boardEl;
    this.hoverReadoutEl = hoverReadoutEl;
    this.racetrackEl = racetrackEl;
    this.onPlaceBet = onPlaceBet;
    this.onRemoveBet = onRemoveBet;

    this.variantId = 'european';
    this.neighbourCount = 2;
    this.cellMap = new Map(); // pocket string -> cell element
    this.spotMap = new Map(); // bet.id -> { element, bet }
    this.currentBets = new Map(); // bet.id -> bet
    this.lastHoveredBet = null;

    this.render();
    this.renderRacetrack();
  }

  setVariant(variantId) {
    this.variantId = variantId;
    this.render();
    this.renderRacetrack();
    this.syncChips(this.currentBets);
  }

  setNeighbourCount(n) {
    this.neighbourCount = n;
  }

  render() {
    this.cellMap.clear();
    this.spotMap.clear();
    this.boardEl.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'felt-grid';

    const isAmerican = this.variantId === 'american';

    // 1. Zero column (0 and optional 00)
    const zeroCol = document.createElement('div');
    zeroCol.className = 'zero-col';

    const z0 = this._createNumberCell(0);
    zeroCol.appendChild(z0);

    if (isAmerican) {
      const z00 = this._createNumberCell('00');
      // Split 0 / 00 hitbox at top of 00 cell
      this._addHitbox(z00, makeSplitBet(0, '00'), {
        top: '-6px', left: '15%', right: '15%', height: '12px'
      });
      zeroCol.appendChild(z00);
    }
    grid.appendChild(zeroCol);

    // 2. Main 1-36 number grid (3 rows x 12 columns)
    // rowIndex 0 => 3, 6, ..., 36
    // rowIndex 1 => 2, 5, ..., 35
    // rowIndex 2 => 1, 4, ..., 34
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 12; col++) {
        const num = col * 3 + (3 - row);
        const cell = this._createNumberCell(num);
        cell.style.gridColumn = String(col + 2);
        cell.style.gridRow = String(row + 1);

        // Horizontal split with right neighbour
        if (col < 11) {
          const rightNum = (col + 1) * 3 + (3 - row);
          this._addHitbox(cell, makeSplitBet(num, rightNum), {
            right: '-6px', top: '20%', bottom: '20%', width: '12px'
          });
        }

        // Vertical split with bottom neighbour OR Street at bottom of row 2
        if (row < 2) {
          const bottomNum = col * 3 + (3 - (row + 1));
          this._addHitbox(cell, makeSplitBet(num, bottomNum), {
            bottom: '-6px', left: '20%', right: '20%', height: '12px'
          });
        } else {
          // Bottom border of bottom row -> Street (3 numbers in col)
          const n1 = col * 3 + 1;
          this._addHitbox(cell, makeStreetBet([n1, n1 + 1, n1 + 2]), {
            bottom: '-6px', left: '20%', right: '20%', height: '12px'
          });
        }

        // Corner (row < 2, col < 11) or Six Line (row === 2, col < 11)
        if (col < 11) {
          if (row < 2) {
            const rightNum = (col + 1) * 3 + (3 - row);
            const botNum = col * 3 + (3 - (row + 1));
            const diagNum = (col + 1) * 3 + (3 - (row + 1));
            this._addHitbox(cell, makeCornerBet([num, rightNum, botNum, diagNum]), {
              right: '-7px', bottom: '-7px', width: '14px', height: '14px'
            });
          } else {
            const n1 = col * 3 + 1;
            this._addHitbox(
              cell,
              makeSixLineBet([n1, n1 + 1, n1 + 2, n1 + 3, n1 + 4, n1 + 5]),
              { right: '-7px', bottom: '-7px', width: '14px', height: '14px' }
            );
          }
        }

        // Zero-adjacent splits, trios, First Four / Top Line on column 0
        if (col === 0) {
          if (!isAmerican) {
            // Splits 0/3, 0/2, 0/1
            this._addHitbox(cell, makeSplitBet(0, num), {
              left: '-6px', top: '20%', bottom: '20%', width: '12px'
            });
            if (num === 2) {
              this._addHitbox(cell, makeStreetBet([0, 2, 3], 0, 'Trio 0-2-3'), {
                left: '-7px', top: '-7px', width: '14px', height: '14px'
              });
            }
            if (num === 1) {
              this._addHitbox(cell, makeStreetBet([0, 1, 2], 0, 'Trio 0-1-2'), {
                left: '-7px', top: '-7px', width: '14px', height: '14px'
              });
              this._addHitbox(cell, makeCornerBet([0, 1, 2, 3], 0, 'First Four 0-1-2-3'), {
                left: '-7px', bottom: '-7px', width: '14px', height: '14px'
              });
            }
          } else {
            // American 0 & 00 adjacent bets
            if (num === 3) {
              this._addHitbox(cell, makeSplitBet(0, 3), {
                left: '-6px', top: '20%', bottom: '20%', width: '12px'
              });
            } else if (num === 2) {
              this._addHitbox(cell, makeSplitBet(0, 2), {
                left: '-6px', top: '8%', height: '36%', width: '12px'
              });
              this._addHitbox(cell, makeSplitBet('00', 2), {
                left: '-6px', bottom: '8%', height: '36%', width: '12px'
              });
              this._addHitbox(cell, makeStreetBet([0, 2, 3], 0, 'Trio 0-2-3'), {
                left: '-7px', top: '-7px', width: '14px', height: '14px'
              });
            } else if (num === 1) {
              this._addHitbox(cell, makeSplitBet('00', 1), {
                left: '-6px', top: '20%', bottom: '20%', width: '12px'
              });
              this._addHitbox(cell, makeStreetBet(['00', 1, 2], 0, 'Trio 00-1-2'), {
                left: '-7px', top: '-7px', width: '14px', height: '14px'
              });
              this._addHitbox(cell, makeTopLineBet(), {
                left: '-7px', bottom: '-7px', width: '14px', height: '14px'
              });
            }
          }
        }

        grid.appendChild(cell);
      }
    }

    // 3. Column 2:1 boxes (rows 0,1,2 -> COL_3, COL_2, COL_1)
    const colKeys = ['COL_3', 'COL_2', 'COL_1'];
    for (let row = 0; row < 3; row++) {
      const bet = OUTSIDE_BETS[colKeys[row]]();
      const cell = this._createOutsideCell(bet, '2:1');
      cell.style.gridColumn = '14';
      cell.style.gridRow = String(row + 1);
      grid.appendChild(cell);
    }

    // 4. Dozens row (row 4)
    const dozens = [
      { key: 'DOZ_1', label: '1st 12 (1–12)', startCol: 2 },
      { key: 'DOZ_2', label: '2nd 12 (13–24)', startCol: 6 },
      { key: 'DOZ_3', label: '3rd 12 (25–36)', startCol: 10 }
    ];
    for (const d of dozens) {
      const bet = OUTSIDE_BETS[d.key]();
      const cell = this._createOutsideCell(bet, d.label);
      cell.style.gridColumn = `${d.startCol} / span 4`;
      cell.style.gridRow = '4';
      grid.appendChild(cell);
    }

    // 5. Even-Money row (row 5)
    const evens = [
      { key: 'LOW', label: '1–18', startCol: 2 },
      { key: 'EVEN', label: 'EVEN', startCol: 4 },
      { key: 'RED', label: '<span class="diamond red"></span>RED', startCol: 6, html: true },
      { key: 'BLACK', label: '<span class="diamond black"></span>BLACK', startCol: 8, html: true },
      { key: 'ODD', label: 'ODD', startCol: 10 },
      { key: 'HIGH', label: '19–36', startCol: 12 }
    ];
    for (const ev of evens) {
      const bet = OUTSIDE_BETS[ev.key]();
      const cell = this._createOutsideCell(bet, ev.label, ev.html);
      cell.style.gridColumn = `${ev.startCol} / span 2`;
      cell.style.gridRow = '5';
      grid.appendChild(cell);
    }

    this.boardEl.appendChild(grid);
  }

  _createNumberCell(pocket) {
    const norm = normPocket(pocket);
    const color = getPocketColor(norm);
    const cell = document.createElement('div');
    cell.className = `felt-cell ${color}`;
    cell.textContent = String(norm);
    cell.dataset.pocket = String(norm);

    const bet = makeStraightBet(norm);
    this._bindSpot(cell, bet);
    this.cellMap.set(String(norm), cell);
    return cell;
  }

  _createOutsideCell(bet, label, useHtml = false) {
    const cell = document.createElement('div');
    cell.className = 'felt-cell outside';
    if (useHtml) cell.innerHTML = label;
    else cell.textContent = label;

    this._bindSpot(cell, bet);
    return cell;
  }

  _addHitbox(parentCell, bet, styleObj) {
    const hb = document.createElement('div');
    hb.className = 'hitbox';
    Object.assign(hb.style, styleObj);
    this._bindSpot(hb, bet, true);
    parentCell.appendChild(hb);
  }

  _bindSpot(el, bet, stopProp = false) {
    this.spotMap.set(bet.id, { element: el, bet });

    el.addEventListener('mouseenter', (e) => {
      if (stopProp) e.stopPropagation();
      this._highlightBet(bet);
    });

    el.addEventListener('mouseleave', (e) => {
      if (stopProp) e.stopPropagation();
      this._clearHighlights();
    });

    el.addEventListener('click', (e) => {
      if (stopProp) e.stopPropagation();
      if (e.shiftKey) {
        this.onRemoveBet(bet);
      } else {
        this.onPlaceBet(bet);
      }
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (stopProp) e.stopPropagation();
      this.onRemoveBet(bet);
    });
  }

  _highlightBet(bet) {
    this._clearHighlights();
    this.lastHoveredBet = bet;
    for (const num of bet.numbers) {
      const cell = this.cellMap.get(String(num));
      if (cell) cell.classList.add('highlight');
    }
    const pockets = VARIANTS[this.variantId].pockets;
    const hitPct = ((bet.numbers.length / pockets) * 100).toFixed(2);
    const laNote = (VARIANTS[this.variantId].laPartage && bet.isEvenMoney)
      ? ' &bull; La Partage: 50% refund on 0'
      : '';
    this.hoverReadoutEl.innerHTML =
      `<strong>${bet.label}</strong> (${bet.type}) &bull; Pays <strong>${bet.payout}:1</strong> &bull; Coverage ${bet.numbers.length}/${pockets} (${hitPct}%)${laNote}`;
  }

  _clearHighlights() {
    for (const cell of this.cellMap.values()) {
      cell.classList.remove('highlight');
    }
    this.hoverReadoutEl.textContent =
      'Hover over any number, split line, corner, or outside box to inspect odds.';
  }

  clearWinnerPulse() {
    for (const cell of this.cellMap.values()) {
      cell.classList.remove('winner-pulse');
    }
  }

  pulseWinner(outcome) {
    this.clearWinnerPulse();
    const winCell = this.cellMap.get(String(normPocket(outcome)));
    if (winCell) {
      // Force reflow so animation replays cleanly on repeat numbers
      void winCell.offsetWidth;
      winCell.classList.add('winner-pulse');
    }
  }

  syncChips(betsMap) {
    this.currentBets = betsMap;
    // Remove existing chips
    this.boardEl.querySelectorAll('.felt-chip').forEach((c) => c.remove());

    for (const [id, bet] of betsMap.entries()) {
      if (!bet || bet.amount <= 0) continue;
      const spot = this.spotMap.get(id);
      if (!spot) continue;
      const chip = document.createElement('div');
      chip.className = `felt-chip ${this._chipColorClass(bet.amount)}`;
      chip.textContent = this._shortChipLabel(bet.amount);
      spot.element.appendChild(chip);
    }
  }

  _chipColorClass(amount) {
    if (amount >= 1000) return 'c-1000';
    if (amount >= 500) return 'c-500';
    if (amount >= 100) return 'c-100';
    if (amount >= 25) return 'c-25';
    if (amount >= 5) return 'c-5';
    return 'c-1';
  }

  _shortChipLabel(amount) {
    if (amount >= 1000) {
      const k = amount / 1000;
      return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
    }
    return String(Math.round(amount));
  }

  renderRacetrack() {
    const wheel = VARIANTS[this.variantId].wheel;
    this.racetrackEl.innerHTML = '';

    for (const pocket of wheel) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `rt-pocket ${getPocketColor(pocket)}`;
      btn.textContent = String(pocket);
      btn.dataset.pocket = String(pocket);

      btn.addEventListener('mouseenter', () => {
        const nb = this._getNeighbours(pocket);
        this._highlightRacetrack(nb);
        for (const n of nb) {
          const cell = this.cellMap.get(String(n));
          if (cell) cell.classList.add('highlight');
        }
        this.hoverReadoutEl.innerHTML =
          `<strong>${pocket} &amp; &plusmn;${this.neighbourCount} Neighbours</strong> &bull; ${nb.length} Straight-Up chips (35:1 each)`;
      });

      btn.addEventListener('mouseleave', () => {
        this.racetrackEl.querySelectorAll('.nb-hover').forEach((el) => el.classList.remove('nb-hover'));
        this._clearHighlights();
      });

      btn.addEventListener('click', () => {
        const nb = this._getNeighbours(pocket);
        for (const n of nb) {
          this.onPlaceBet(makeStraightBet(n));
        }
      });

      this.racetrackEl.appendChild(btn);
    }
  }

  _getNeighbours(centerPocket) {
    const wheel = VARIANTS[this.variantId].wheel;
    const norm = normPocket(centerPocket);
    const idx = wheel.indexOf(norm);
    const res = [];
    for (let d = -this.neighbourCount; d <= this.neighbourCount; d++) {
      res.push(wheel[(idx + d + wheel.length) % wheel.length]);
    }
    return res;
  }

  _highlightRacetrack(pockets) {
    const set = new Set(pockets.map(String));
    this.racetrackEl.querySelectorAll('.rt-pocket').forEach((el) => {
      if (set.has(el.dataset.pocket)) el.classList.add('nb-hover');
    });
  }
}

function makeBetHelper(nums) {
  return makeStreetBet(nums, 0, `Trio ${nums.join('-')}`);
}
