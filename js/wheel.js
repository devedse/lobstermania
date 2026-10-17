/* The Big Wheel Bonus.
   Top screen: the big ship's wheel with the Mother Lode / Full Trap meters, pointer at the top.
   Bottom screen: a glowing mini wheel, "touch & drag to spin" and a SPIN x OF n counter.
   The promo only ever shows the top half of the wheel, so the wheel is drawn here
   (slice order and colours follow the promo frames; prizes are in LM.WHEEL). */
(function () {
  const { el, img, sleep } = LM.Bonus;
  const W = LM.WHEEL;
  const N = W.slices.length;
  const SLICE = (Math.PI * 2) / N;

  // Top-screen geometry (design pixels)
  const TOP_W = 963;
  const TOP_H = 530;
  const CX = 481;
  const CY = 500;
  const R = 410; // slices
  const RIM = 452; // outer edge of the wooden rim
  const HANDLE = 520; // tips of the handles
  const FONT = '"Luckiest Guy", "Arial Black", sans-serif';

  // ---------- drawing helpers ----------
  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function wood(g, x0, y0, x1, y1) {
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, "#8a4f1d");
    grad.addColorStop(0.5, "#6b3812");
    grad.addColorStop(1, "#4a240a");
    return grad;
  }

  function stud(g, x, y, r) {
    const grad = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    grad.addColorStop(0, "#fff6b0");
    grad.addColorStop(0.5, "#e2b23a");
    grad.addColorStop(1, "#8a5a10");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  /** Letters stacked from the rim towards the hub, each upright towards the rim. */
  function stacked(g, text, r0, size, shrink, style) {
    let r = r0;
    for (const ch of text) {
      g.save();
      g.translate(0, -r);
      g.font = `${size}px ${FONT}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineJoin = "round";
      g.lineWidth = style.stroke;
      g.strokeStyle = style.strokeColor;
      g.strokeText(ch, 0, 0);
      g.fillStyle = style.fill(g, size);
      g.fillText(ch, 0, 0);
      g.restore();
      r -= size * (style.step || 0.86);
      size *= shrink;
    }
  }

  const gold = (g, size) => {
    const grad = g.createLinearGradient(0, -size / 2, 0, size / 2);
    grad.addColorStop(0, "#fff36a");
    grad.addColorStop(0.45, "#ffc21a");
    grad.addColorStop(1, "#ff6a00");
    return grad;
  };

  function sliceLabel(g, slice, mult) {
    if (slice.type === "credits") {
      const text = String(slice.value * mult);
      const size = text.length >= 4 ? 84 : 92;
      stacked(g, text, R - 52, size, 0.8, { stroke: 7, strokeColor: "#fff", fill: () => "#111", step: 0.84 });
    } else if (slice.type === "buoy") {
      g.save();
      g.translate(0, -(R - 34));
      g.font = `30px ${FONT}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 6;
      g.strokeStyle = "#13226a";
      g.strokeText("BUOY", 0, 0);
      g.fillStyle = gold(g, 30);
      g.fillText("BUOY", 0, 0);
      g.restore();
      stacked(g, "BONUS", R - 88, 62, 0.82, { stroke: 7, strokeColor: "#13226a", fill: gold, step: 0.88 });
    } else {
      // Progressive: purple badge with the name, then PROGRESSIVE down the slice
      const name = slice.type === "mother" ? ["MOTHER", "LODE"] : ["FULL", "TRAP"];
      g.save();
      g.translate(0, -(R - 50));
      g.fillStyle = "#6a1fb5";
      g.strokeStyle = "#f5d7ff";
      g.lineWidth = 3;
      g.beginPath();
      g.roundRect(-44, -32, 88, 64, 10);
      g.fill();
      g.stroke();
      g.font = `22px ${FONT}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = "#ffe94a";
      g.fillText(name[0], 0, -12);
      g.fillText(name[1], 0, 14);
      g.restore();
      stacked(g, "PROGRESSIVE", R - 106, 30, 0.93, {
        stroke: 5,
        strokeColor: "#0b3d0b",
        fill: () => "#9dff3a",
        step: 0.9,
      });
    }
  }

  /** The turning part: handles, rim, slices and labels, centred in a square canvas. */
  function renderWheel(mult) {
    const S = HANDLE * 2 + 20;
    const c = canvas(S, S);
    const g = c.getContext("2d");
    g.translate(S / 2, S / 2);

    // 8 handles sticking out past the rim
    for (let i = 0; i < 8; i++) {
      g.save();
      g.rotate((i * Math.PI) / 4 + SLICE / 2);
      g.fillStyle = wood(g, -18, 0, 18, 0);
      g.beginPath();
      g.roundRect(-17, -HANDLE, 34, HANDLE - RIM + 30, 14);
      g.fill();
      g.fillStyle = "#c79a2c";
      g.fillRect(-20, -RIM - 26, 40, 12);
      g.restore();
    }
    // wooden rim with brass studs
    g.fillStyle = wood(g, -RIM, -RIM, RIM, RIM);
    g.beginPath();
    g.arc(0, 0, RIM, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2e1505";
    g.lineWidth = 4;
    g.stroke();
    for (let i = 0; i < N * 2; i++) {
      const a = (i * SLICE) / 2;
      stud(g, Math.sin(a) * (R + 22), -Math.cos(a) * (R + 22), 6);
    }
    // slices
    W.slices.forEach((slice, i) => {
      g.save();
      g.rotate(i * SLICE);
      const grad = g.createRadialGradient(0, 0, 40, 0, 0, R);
      const col = W.colors[i % W.colors.length];
      grad.addColorStop(0, shade(col, -0.25));
      grad.addColorStop(0.55, col);
      grad.addColorStop(1, shade(col, 0.18));
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, R, -Math.PI / 2 - SLICE / 2, -Math.PI / 2 + SLICE / 2);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(40, 20, 5, 0.7)";
      g.lineWidth = 3;
      g.stroke();
      sliceLabel(g, slice, mult);
      g.restore();
    });
    // inner rim ring
    g.strokeStyle = "#3a1c06";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(0, 0, R + 2, 0, Math.PI * 2);
    g.stroke();
    return c;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
  }

  function renderSky() {
    const c = canvas(TOP_W, TOP_H);
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, TOP_H);
    grad.addColorStop(0, "#1c6fd6");
    grad.addColorStop(0.6, "#4aa3f0");
    grad.addColorStop(1, "#9fd4ff");
    g.fillStyle = grad;
    g.fillRect(0, 0, TOP_W, TOP_H);
    g.filter = "blur(10px)";
    g.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (const [x, y, w, h] of [[60, 250, 220, 50], [700, 300, 260, 60], [140, 420, 300, 70], [820, 160, 160, 40], [560, 460, 300, 60]]) {
      g.beginPath();
      g.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.filter = "none";
    return c;
  }

  // ---------- the top screen ----------
  class BigWheel {
    constructor(parent, mult) {
      this.root = el("div", "wheel-top");
      parent.insertBefore(this.root, parent.querySelector(".meter"));
      this.canvas = el("canvas", "", this.root);
      this.canvas.width = TOP_W;
      this.canvas.height = TOP_H;
      this.g = this.canvas.getContext("2d");
      this.sky = renderSky();
      this.wheel = renderWheel(mult);
      this.angle = 0;
      this.pointerKick = 0;
      this.flash = 0;
      this.prize = el("div", "wheel-prize", this.root);
      this.draw();
    }

    draw() {
      const g = this.g;
      g.drawImage(this.sky, 0, 0);
      g.save();
      g.translate(CX, CY);
      g.rotate(this.angle);
      g.drawImage(this.wheel, -this.wheel.width / 2, -this.wheel.height / 2);
      g.restore();
      // winning slice sparkle
      if (this.flash > 0) {
        g.save();
        g.translate(CX, CY);
        g.globalCompositeOperation = "lighter";
        const grad = g.createRadialGradient(0, 0, 40, 0, 0, R);
        grad.addColorStop(0, `rgba(255, 240, 150, ${0.05 * this.flash})`);
        grad.addColorStop(1, `rgba(255, 255, 200, ${0.55 * this.flash})`);
        g.fillStyle = grad;
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, R, -Math.PI / 2 - SLICE / 2, -Math.PI / 2 + SLICE / 2);
        g.closePath();
        g.fill();
        g.restore();
      }
      // hub
      stud(g, CX, CY, 52);
      g.strokeStyle = "#5a3608";
      g.lineWidth = 4;
      g.beginPath();
      g.arc(CX, CY, 52, 0, Math.PI * 2);
      g.stroke();
      // pointer on its wooden post
      g.fillStyle = wood(g, CX - 30, 0, CX + 30, 0);
      g.fillRect(CX - 30, 0, 60, CY - RIM + 6);
      g.save();
      g.translate(CX, CY - RIM + 2);
      g.rotate(this.pointerKick);
      g.fillStyle = "#ffd84a";
      g.strokeStyle = "#7a4b00";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-18, -14);
      g.lineTo(18, -14);
      g.lineTo(0, 42);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    }

    /** Spin clockwise and stop with slice `index` under the pointer. */
    spin(index, ms) {
      const start = this.angle;
      const turns = 4 + Math.floor(Math.random() * 2);
      const jitter = (Math.random() - 0.5) * SLICE * 0.7;
      const target = -index * SLICE + jitter;
      const base = ((target - start) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const delta = turns * Math.PI * 2 + base;
      const t0 = performance.now();
      let lastSlice = Math.floor((start + SLICE / 2) / SLICE);
      return new Promise((resolve) => {
        const frame = (now) => {
          const t = Math.min(1, (now - t0) / ms);
          const eased = 1 - Math.pow(1 - t, 4);
          this.angle = start + delta * eased;
          const s = Math.floor((this.angle + SLICE / 2) / SLICE);
          if (s !== lastSlice) {
            lastSlice = s;
            this.pointerKick = -0.45;
            LM.sound.play("wheelTick");
          }
          this.pointerKick *= 0.8;
          this.draw();
          if (t < 1) requestAnimationFrame(frame);
          else {
            this.angle = start + delta;
            this.pointerKick = 0;
            this.draw();
            resolve();
          }
        };
        requestAnimationFrame(frame);
      });
    }

    async sparkle(ms) {
      const t0 = performance.now();
      while (performance.now() - t0 < ms) {
        this.flash = 0.6 + 0.4 * Math.sin((performance.now() - t0) / 90);
        this.draw();
        await new Promise(requestAnimationFrame);
      }
      this.flash = 0;
      this.draw();
    }

    showPrize(html, cls = "") {
      this.prize.innerHTML = html;
      this.prize.className = "wheel-prize show " + cls;
    }

    hidePrize() {
      this.prize.className = "wheel-prize";
    }

    remove() {
      this.root.remove();
    }
  }

  // ---------- the bottom screen ----------
  function miniWheel() {
    const S = 300;
    const c = canvas(S, S);
    const g = c.getContext("2d");
    g.translate(S / 2, S / 2);
    const colors = ["#ffe82a", "#22d3f5", "#ff3fae", "#9be22c", "#2f6bff", "#ff2f6d", "#3ad13a", "#a23bff"];
    for (let i = 0; i < 12; i++) {
      g.save();
      g.rotate((i * Math.PI) / 6);
      g.fillStyle = wood(g, -9, 0, 9, 0);
      g.beginPath();
      g.roundRect(-9, -146, 18, 50, 8);
      g.fill();
      g.restore();
    }
    g.fillStyle = wood(g, -110, -110, 110, 110);
    g.beginPath();
    g.arc(0, 0, 108, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      stud(g, Math.sin(a) * 98, -Math.cos(a) * 98, 3);
    }
    colors.forEach((col, i) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, 86, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(40, 20, 5, 0.6)";
      g.lineWidth = 2;
      g.stroke();
    });
    stud(g, 0, 0, 14);
    return c;
  }

  class SpinPanel {
    constructor(layer, total) {
      this.root = el("div", "wheel-bottom bonus-screen", layer);
      this.wheelBox = el("div", "mini-wheel", this.root);
      this.wheelBox.appendChild(miniWheel());
      this.hint = el(
        "div",
        "wheel-hint",
        this.root,
        `<div class="wheel-arrow up"></div><div class="wheel-hint-text">TOUCH &amp; DRAG<br>ON THE SCREEN TO<br>SPIN THE WHEEL</div><div class="wheel-arrow down"></div>`
      );
      this.lookUp = el("div", "wheel-lookup", this.root, `<span class="lm-num">LOOK<br>UP!</span>`);
      this.counter = el("div", "wheel-counter", this.root);
      this.total = total;
      this.setSpin(0);
    }

    setSpin(n) {
      this.counter.innerHTML = `SPIN<br><b>${n} OF ${this.total}</b>`;
    }

    /** Wait for a drag (or a click, space or Enter); resolves with the drag speed 0..1. */
    waitForSpin() {
      this.root.classList.add("ready");
      return new Promise((resolve) => {
        let down = null;
        const done = (power) => {
          this.root.classList.remove("ready");
          this.root.onpointerdown = this.root.onpointermove = this.root.onpointerup = null;
          removeEventListener("keydown", onKey, true);
          resolve(power);
        };
        const onKey = (e) => {
          if (e.code === "Space" || e.code === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            done(0.7);
          }
        };
        this.root.onpointerdown = (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() });
        this.root.onpointermove = (e) => {
          if (!down) return;
          const d = Math.hypot(e.clientX - down.x, e.clientY - down.y);
          if (d > 60) done(Math.min(1, d / Math.max(1, performance.now() - down.t) / 2));
        };
        this.root.onpointerup = () => down && done(0.6);
        addEventListener("keydown", onKey, true);
      });
    }

    spinning(on) {
      this.root.classList.toggle("spinning", on);
    }

    remove() {
      this.root.remove();
    }
  }

  // ---------- the bonus ----------
  async function initiated(layer, spins) {
    const b = el("div", "wheel-initiated", layer);
    img("assets/wheel/initiated.png", "", b);
    el("div", "wheel-initiated-spins", b, `${spins} SPIN${spins > 1 ? "S" : ""} AWARDED`);
    LM.sound.play("bonus");
    await sleep(3000);
    b.remove();
  }

  /**
   * Run the Big Wheel Bonus. ctx provides:
   *   layer, topLayer, spins, mult, speed, money(credits), setMessage(text), showWin(credits),
   *   progressive(type) -> credits won from that meter (the game pays and resets it)
   * Resolves with { credits, buoyBonuses }: credits already won, and how many Buoy Bonuses to play next.
   */
  async function run(ctx) {
    await document.fonts.load(`40px ${FONT}`).catch(() => {});
    await initiated(ctx.layer, ctx.spins);
    LM.sound.music(true);
    ctx.topLayer.classList.add("wheel-mode");
    const wheel = new BigWheel(ctx.topLayer, ctx.mult);
    const panel = new SpinPanel(ctx.layer, ctx.spins);
    let credits = 0;
    let buoyBonuses = 0;

    for (let n = 1; n <= ctx.spins; n++) {
      ctx.setMessage(`BIG WHEEL BONUS · SPIN ${n} OF ${ctx.spins} · DRAG OR PRESS SPACE TO SPIN`);
      const power = await panel.waitForSpin();
      panel.setSpin(n);
      panel.spinning(true);
      LM.sound.play("wheelSpin");
      const index = LM.engine.rollWheel();
      const slice = W.slices[index];
      await wheel.spin(index, (5200 + power * 1500) * ctx.speed);
      panel.spinning(false);

      if (slice.type === "credits") {
        const won = slice.value * ctx.mult;
        credits += won;
        LM.sound.play("prize");
        wheel.showPrize(`<span class="lm-num">${won.toLocaleString()}</span><small>CREDITS</small>`);
      } else if (slice.type === "buoy") {
        buoyBonuses++;
        LM.sound.play("award");
        wheel.showPrize(`<span class="lm-num">BUOY<br>BONUS!</span>`, "buoy");
      } else {
        const won = ctx.progressive(slice.type);
        credits += won;
        LM.sound.play("jackpot");
        LM.fx.coinShower(4000, 3);
        const name = slice.type === "mother" ? "MOTHER LODE" : "FULL TRAP";
        wheel.showPrize(`<span class="lm-num">${name}!</span><small>${ctx.money(won)}</small>`, "jackpot");
      }
      ctx.showWin(credits);
      ctx.setMessage(`BIG WHEEL BONUS WIN ${ctx.money(credits)}${buoyBonuses ? ` + ${buoyBonuses} BUOY BONUS` : ""}`);
      await wheel.sparkle(slice.type === "mother" || slice.type === "trap" ? 3500 : 2000);
      wheel.hidePrize();
      await sleep(300);
    }

    panel.remove();
    LM.sound.music(false);
    if (credits) await LM.Bonus.totalBoard({ layer: ctx.layer }, credits);
    wheel.remove();
    ctx.topLayer.classList.remove("wheel-mode");
    return { credits, buoyBonuses };
  }

  LM.BigWheel = { run };
})();
