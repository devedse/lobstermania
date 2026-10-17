/* Screen effects: a shower of spinning gold coins for big wins, jackpots and bonus totals. */
(function () {
  const W = 963;
  const H = 1113;
  let canvas, g;
  let coins = [];
  let running = false;
  let spawnUntil = 0;
  let rate = 0; // coins per frame (fractions carry over)
  let carry = 0;

  function setup() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.id = "fx";
    canvas.width = W;
    canvas.height = H;
    document.getElementById("stage").appendChild(canvas);
    g = canvas.getContext("2d");
  }

  function spawn() {
    const fromTop = Math.random() < 0.55;
    coins.push({
      x: fromTop ? Math.random() * W : W / 2 + (Math.random() - 0.5) * 300,
      y: fromTop ? -30 : H - 120,
      vx: fromTop ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 9,
      vy: fromTop ? 2 + Math.random() * 3 : -14 - Math.random() * 9,
      r: 13 + Math.random() * 9,
      spin: Math.random() * Math.PI * 2,
      spinV: 0.12 + Math.random() * 0.2,
    });
  }

  function drawCoin(c) {
    const w = Math.max(0.12, Math.abs(Math.cos(c.spin)));
    g.save();
    g.translate(c.x, c.y);
    g.scale(w, 1);
    const grad = g.createRadialGradient(-c.r * 0.3, -c.r * 0.3, 1, 0, 0, c.r);
    grad.addColorStop(0, "#fff7b0");
    grad.addColorStop(0.45, "#ffcc2a");
    grad.addColorStop(1, "#b86e00");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, c.r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#8a4f00";
    g.lineWidth = 2;
    g.stroke();
    g.beginPath();
    g.arc(0, 0, c.r * 0.66, 0, Math.PI * 2);
    g.strokeStyle = "rgba(140, 80, 0, 0.6)";
    g.stroke();
    g.restore();
  }

  function frame() {
    g.clearRect(0, 0, W, H);
    const now = performance.now();
    if (now < spawnUntil) {
      carry += rate;
      for (; carry >= 1; carry--) if (coins.length < 140) spawn();
    }
    coins = coins.filter((c) => c.y < H + 40);
    for (const c of coins) {
      c.vy += 0.42;
      c.x += c.vx;
      c.y += c.vy;
      c.spin += c.spinV;
      drawCoin(c);
    }
    if (coins.length || now < spawnUntil) requestAnimationFrame(frame);
    else {
      running = false;
      g.clearRect(0, 0, W, H);
    }
  }

  /** Rain coins for `ms` milliseconds. intensity 1 = a sprinkle, 3 = a downpour. */
  function coinShower(ms, intensity = 1) {
    setup();
    spawnUntil = Math.max(spawnUntil, performance.now() + ms);
    rate = [0.3, 0.3, 0.55, 0.85][Math.max(1, Math.min(3, Math.round(intensity)))];
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  function stop() {
    spawnUntil = 0;
  }

  LM.fx = { coinShower, stop };
})();
