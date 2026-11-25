import { formatMoney } from './roulette-engine.js';

/**
 * Interactive Bankroll Trajectory & Monte Carlo Fan Chart
 */
export class TrajectoryChart {
  constructor(canvas, tooltipEl) {
    this.canvas = canvas;
    this.tooltipEl = tooltipEl;
    this.ctx = canvas.getContext('2d');

    this.mode = 'session'; // 'session' | 'montecarlo'
    this.sessionData = [5000];
    this.startBankroll = 5000;
    this.mcData = null;
    this.hoverIndex = null;

    this._setupResize();
    this._bindMouse();
  }

  _setupResize() {
    this.resize = () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const width = Math.max(260, Math.floor(rect.width - 12));
      const height = 205;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = width;
      this.height = height;
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.draw();
    };

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeRaf = null;
      new ResizeObserver(() => {
        if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
        this._resizeRaf = requestAnimationFrame(() => this.resize());
      }).observe(this.canvas.parentElement);
    }
    this.resize();
  }

  _bindMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const pad = this._padding();
      const plotW = this.width - pad.left - pad.right;
      const len = this.mode === 'montecarlo' && this.mcData
        ? this.mcData.meanPath.length
        : this.sessionData.length;

      if (len < 1 || mx < pad.left || mx > this.width - pad.right) {
        this.hoverIndex = null;
        this.tooltipEl.classList.add('hidden');
        this.draw();
        return;
      }

      const ratio = len === 1 ? 0 : (mx - pad.left) / plotW;
      const idx = Math.max(0, Math.min(len - 1, Math.round(ratio * (len - 1))));
      this.hoverIndex = idx;

      if (this.mode === 'montecarlo' && this.mcData) {
        const val = this.mcData.meanPath[idx];
        this.tooltipEl.textContent = `Spin ${idx} • Mean ${formatMoney(val)}`;
      } else {
        const val = this.sessionData[idx];
        const pnl = val - this.startBankroll;
        this.tooltipEl.textContent = `Spin ${idx} • ${formatMoney(val)} (${formatMoney(pnl, true)})`;
      }

      this.tooltipEl.classList.remove('hidden');
      const tipX = Math.min(this.width - 150, Math.max(8, mx - 55));
      this.tooltipEl.style.left = `${tipX}px`;
      this.tooltipEl.style.top = `10px`;
      this.draw();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverIndex = null;
      this.tooltipEl.classList.add('hidden');
      this.draw();
    });
  }

  _padding() {
    return { top: 24, right: 14, bottom: 22, left: 50 };
  }

  setSessionData(series, startBankroll) {
    this.mode = 'session';
    this.sessionData = series.length ? series : [startBankroll];
    this.startBankroll = startBankroll;
    this.draw();
  }

  setMonteCarloData(mcResult) {
    this.mode = 'montecarlo';
    this.mcData = mcResult;
    this.startBankroll = mcResult.startBankroll;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const pad = this._padding();
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Determine Y bounds
    let minVal = this.startBankroll;
    let maxVal = this.startBankroll;
    let xCount = 1;

    if (this.mode === 'montecarlo' && this.mcData) {
      xCount = this.mcData.meanPath.length;
      for (const path of this.mcData.paths) {
        for (const v of path) {
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
      }
    } else {
      xCount = this.sessionData.length;
      for (const v of this.sessionData) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }

    if (maxVal === minVal) {
      const margin = Math.max(100, this.startBankroll * 0.05);
      minVal = Math.max(0, minVal - margin);
      maxVal += margin;
    } else {
      const span = maxVal - minVal;
      minVal = Math.max(0, minVal - span * 0.08);
      maxVal += span * 0.08;
    }

    const toX = (i) => xCount <= 1 ? pad.left : pad.left + (i / (xCount - 1)) * plotW;
    const toY = (v) => pad.top + ((maxVal - v) / (maxVal - minVal)) * plotH;

    // Horizontal gridlines & Y labels
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const span = maxVal - minVal;
    const ticks = [minVal, (minVal + maxVal) / 2, maxVal];
    for (const tv of ticks) {
      const y = toY(tv);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#6f8278';
      ctx.fillText(this._shortMoney(tv, span), pad.left - 6, y);
    }

    // Starting bankroll dashed reference line
    const baseY = toY(this.startBankroll);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, baseY);
    ctx.lineTo(w - pad.right, baseY);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    if (this.mode === 'montecarlo' && this.mcData) {
      // Draw 50 semi-transparent sample paths
      for (const path of this.mcData.paths) {
        const finalV = path[path.length - 1];
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const x = toX(i);
          const y = toY(path[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = finalV >= this.startBankroll
          ? 'rgba(34, 197, 94, 0.16)'
          : 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw bold gold Mean path
      const mean = this.mcData.meanPath;
      ctx.beginPath();
      for (let i = 0; i < mean.length; i++) {
        const x = toX(i);
        const y = toY(mean[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Header badge inside chart
      ctx.fillStyle = '#9db0a6';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`50 Runs × ${this.mcData.spinsPerRun} Spins • Gold = Mean`, pad.left + 4, 11);
    } else {
      // Single session trajectory
      const data = this.sessionData;
      const latest = data[data.length - 1];
      const lineColor = latest >= this.startBankroll ? '#22c55e' : '#ef4444';

      if (data.length > 1) {
        // Area fill under curve
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
        grad.addColorStop(0, latest >= this.startBankroll ? 'rgba(34, 197, 94, 0.24)' : 'rgba(239, 68, 68, 0.22)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(toX(0), pad.top + plotH);
        for (let i = 0; i < data.length; i++) {
          ctx.lineTo(toX(i), toY(data[i]));
        }
        ctx.lineTo(toX(data.length - 1), pad.top + plotH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Main line
        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = toX(i);
          const y = toY(data[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Highlight dot at spin 0 or latest
      const dotX = data.length === 1 ? pad.left : toX(data.length - 1);
      const dotY = toY(latest);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = data.length === 1 ? '#eab308' : lineColor;
      ctx.fill();

      // Top-left readout
      ctx.fillStyle = '#9db0a6';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Spin ${data.length - 1} • ${formatMoney(latest)}`, pad.left + 4, 11);
    }

    // Hover crosshair
    if (this.hoverIndex !== null) {
      const hx = toX(this.hoverIndex);
      const hv = this.mode === 'montecarlo' && this.mcData
        ? this.mcData.meanPath[this.hoverIndex]
        : this.sessionData[this.hoverIndex];
      const hy = toY(hv);

      ctx.beginPath();
      ctx.moveTo(hx, pad.top);
      ctx.lineTo(hx, pad.top + plotH);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();
    }
  }

  _shortMoney(v, span = 1000) {
    if (v >= 1000 && span >= 300) {
      const k = v / 1000;
      return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return `$${Math.round(v).toLocaleString('en-US')}`;
  }
}
