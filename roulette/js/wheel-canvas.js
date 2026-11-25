import { VARIANTS, getPocketColor, normPocket } from './roulette-engine.js';

/**
 * Animated High-DPI HTML5 Canvas Roulette Wheel
 */
export class RouletteWheelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.variantId = 'european';
    this.wheelAngle = -Math.PI / 2;
    this.ballAngle = -Math.PI / 2;
    this.ballRadiusFactor = 0.72; // 0.87 = outer track, 0.69 = resting pocket
    this.highlightedPocket = null;
    this.isSpinning = false;
    this.rafId = null;
    this._setupHiDPI();
    this.draw();
  }

  _setupHiDPI() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 256;
    this.size = size;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setVariant(variantId) {
    this.variantId = variantId;
    this.highlightedPocket = null;
    this.draw();
  }

  /**
   * Animate wheel & ivory ball landing on `outcome` pocket.
   * speedMode: 'normal' | 'fast' | 'instant'
   */
  spinTo(outcome, speedMode = 'normal', onTick = null) {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    const wheel = VARIANTS[this.variantId].wheel;
    const target = normPocket(outcome);
    const pocketIndex = wheel.indexOf(target);
    const sliceAngle = (Math.PI * 2) / wheel.length;

    if (speedMode === 'instant') {
      this.wheelAngle = (this.wheelAngle + Math.PI * 1.2) % (Math.PI * 2);
      const pocketCenter = this.wheelAngle + pocketIndex * sliceAngle;
      this.ballAngle = pocketCenter;
      this.ballRadiusFactor = 0.67;
      this.highlightedPocket = target;
      this.isSpinning = false;
      this.draw();
      return Promise.resolve();
    }

    const duration = speedMode === 'fast' ? 680 : 2550;
    const startWheel = this.wheelAngle;
    const wheelDelta = (speedMode === 'fast' ? 1.8 : 4.2) * Math.PI * 2 + Math.random() * 1.4;
    const finalWheelAngle = startWheel + wheelDelta;

    const finalPocketAngle = finalWheelAngle + pocketIndex * sliceAngle;
    const startBall = this.ballAngle;
    const extraBallRevs = (speedMode === 'fast' ? 3 : 7) * Math.PI * 2;
    // Counter-rotate ball relative to wheel
    const targetBallAngle = finalPocketAngle - extraBallRevs - (((finalPocketAngle - startBall) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) === 0 ? 0 : 0);
    // Compute clean delta so ball ends strictly at finalPocketAngle (mod 2PI)
    const twoPi = Math.PI * 2;
    const normFinal = ((finalPocketAngle % twoPi) + twoPi) % twoPi;
    const normStart = ((startBall % twoPi) + twoPi) % twoPi;
    let diff = normFinal - normStart;
    if (diff > 0) diff -= twoPi;
    const totalBallDelta = diff - extraBallRevs;

    this.isSpinning = true;
    this.highlightedPocket = null;
    const startTime = performance.now();
    let lastTickStep = 0;

    return new Promise((resolve) => {
      const frame = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);

        // Smooth quintic/cubic ease-out
        const wheelEase = 1 - Math.pow(1 - t, 3);
        const ballEase = 1 - Math.pow(1 - t, 3.3);

        this.wheelAngle = startWheel + wheelDelta * wheelEase;
        this.ballAngle = startBall + totalBallDelta * ballEase;

        // Ball drops from outer wooden track (0.88) into pocket (0.67) between t=0.58 and t=0.92
        if (t < 0.58) {
          this.ballRadiusFactor = 0.88;
        } else if (t < 0.92) {
          const dropT = (t - 0.58) / 0.34;
          const bounce = Math.sin(dropT * Math.PI * 3.5) * (1 - dropT) * 0.04;
          this.ballRadiusFactor = 0.88 - 0.21 * (1 - Math.pow(1 - dropT, 2)) + bounce;
        } else {
          this.ballRadiusFactor = 0.67;
        }

        // Audio tick callback as ball passes pockets
        if (onTick && t < 0.9) {
          const tickStep = Math.floor(Math.abs(totalBallDelta * ballEase) / (sliceAngle * 2));
          if (tickStep > lastTickStep) {
            lastTickStep = tickStep;
            onTick();
          }
        }

        this.draw();

        if (t < 1) {
          this.rafId = requestAnimationFrame(frame);
        } else {
          this.isSpinning = false;
          this.highlightedPocket = target;
          this.ballRadiusFactor = 0.67;
          this.ballAngle = finalPocketAngle;
          this.draw();
          resolve();
        }
      };

      this.rafId = requestAnimationFrame(frame);
    });
  }

  draw() {
    const ctx = this.ctx;
    const s = this.size;
    const cx = s / 2;
    const cy = s / 2;
    const R = s * 0.47;

    ctx.clearRect(0, 0, s, s);

    // Outer mahogany rim
    const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
    rimGrad.addColorStop(0, '#4c2614');
    rimGrad.addColorStop(0.65, '#6a381d');
    rimGrad.addColorStop(0.9, '#3a1a0c');
    rimGrad.addColorStop(1, '#221007');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Rim gold trim
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.97, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Outer ball track groove
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.83, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 8 brass diamond deflectors on static bowl
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const dx = cx + Math.cos(a) * (R * 0.885);
      const dy = cy + Math.sin(a) * (R * 0.885);
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(a);
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(4.5, 0);
      ctx.lineTo(0, 3);
      ctx.lineTo(-4.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Rotating pocket ring
    const wheel = VARIANTS[this.variantId].wheel;
    const slice = (Math.PI * 2) / wheel.length;
    const outerPocketR = R * 0.81;
    const innerNumberR = R * 0.62;
    const innerPocketR = R * 0.50;

    for (let i = 0; i < wheel.length; i++) {
      const pocket = wheel[i];
      const centerAngle = this.wheelAngle + i * slice;
      const startA = centerAngle - slice / 2;
      const endA = centerAngle + slice / 2;
      const color = getPocketColor(pocket);

      // Colored pocket sector
      ctx.beginPath();
      ctx.arc(cx, cy, outerPocketR, startA, endA);
      ctx.arc(cx, cy, innerPocketR, endA, startA, true);
      ctx.closePath();

      if (color === 'green') ctx.fillStyle = '#15803d';
      else if (color === 'red') ctx.fillStyle = '#b91c1c';
      else ctx.fillStyle = '#14171a';
      ctx.fill();

      // Highlight winning pocket softly
      if (!this.isSpinning && this.highlightedPocket !== null && normPocket(pocket) === normPocket(this.highlightedPocket)) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
        ctx.fill();
      }

      // Gold fret divider
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(startA) * innerPocketR, cy + Math.sin(startA) * innerPocketR);
      ctx.lineTo(cx + Math.cos(startA) * outerPocketR, cy + Math.sin(startA) * outerPocketR);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.65)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number label
      const numR = (outerPocketR + innerNumberR) / 2 + 1;
      ctx.save();
      ctx.translate(cx + Math.cos(centerAngle) * numR, cy + Math.sin(centerAngle) * numR);
      ctx.rotate(centerAngle + Math.PI / 2);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(pocket), 0, 0);
      ctx.restore();
    }

    // Inner pocket divider ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerNumberR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner dark cone
    const coneGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, innerPocketR);
    coneGrad.addColorStop(0, '#5a3a18');
    coneGrad.addColorStop(0.55, '#2b1b0e');
    coneGrad.addColorStop(1, '#120b06');
    ctx.beginPath();
    ctx.arc(cx, cy, innerPocketR, 0, Math.PI * 2);
    ctx.fillStyle = coneGrad;
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Center rotating brass turret (4 spokes)
    for (let k = 0; k < 4; k++) {
      const spokeA = this.wheelAngle + (k * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(spokeA) * (innerPocketR * 0.78), cy + Math.sin(spokeA) * (innerPocketR * 0.78));
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(spokeA) * (innerPocketR * 0.78),
        cy + Math.sin(spokeA) * (innerPocketR * 0.78),
        3.5, 0, Math.PI * 2
      );
      ctx.fillStyle = '#fde047';
      ctx.fill();
    }

    // Center turret hub glow
    const hubGrad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 16);
    hubGrad.addColorStop(0, '#fef08a');
    hubGrad.addColorStop(0.5, '#d97706');
    hubGrad.addColorStop(1, '#78350f');
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    // Ivory ball
    const ballR = R * this.ballRadiusFactor;
    const bx = cx + Math.cos(this.ballAngle) * ballR;
    const by = cy + Math.sin(this.ballAngle) * ballR;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    const ballGrad = ctx.createRadialGradient(bx - 1.5, by - 1.5, 0.8, bx, by, 5.2);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.7, '#e2e8f0');
    ballGrad.addColorStop(1, '#94a3b8');
    ctx.beginPath();
    ctx.arc(bx, by, 4.8, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();
    ctx.restore();
  }
}
