/* Lobstermania 3 home remake: game flow, button bar, settings and saving. Play money only. */
(function () {
  const C = LM.CONFIG;
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = "lobstermania3.save";

  // ---------- saved state ----------
  const defaults = {
    credits: C.startingCredits,
    multIndex: C.multipliers.length - 1, // machine default: bet multiplier 5
    level: 3,
    turbo: false,
    testMode: false,
    sound: { on: true, volume: 0.7, music: true, musicVolume: 0.6 },
    auto: { spins: 25, stopAfterBonus: false },
    startingCredits: C.startingCredits,
    motherLode: C.progressives.motherLode.seed,
    fullTrap: C.progressives.fullTrap.seed,
    stats: { spins: 0, bet: 0, won: 0, biggest: 0, bonuses: 0, wheels: 0, jackpots: 0 },
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved)
        return {
          ...defaults,
          ...saved,
          stats: { ...defaults.stats, ...saved.stats },
          sound: { ...defaults.sound, ...saved.sound },
          auto: { ...defaults.auto, ...saved.auto },
        };
    } catch (e) {
      /* storage unavailable or corrupt: start fresh */
    }
    return structuredClone(defaults);
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      /* private window etc.: keep playing without saving */
    }
  }

  const state = load();
  let strips = LM.engine.buildStrips(state.level);
  let reels;
  let busy = false; // reels spinning or bonus running
  let rolling = null; // active win rollup, so a click can finish it
  let winCycle = null;
  let autoLeft = 0; // autoplay spins still to go
  let autoRunning = false; // autoplay on (also during the bonus of its last spin)
  LM.autoplay = { active: () => autoRunning };

  // ---------- helpers ----------
  const money = (credits) => "$" + ((credits * C.centsPerCredit) / 100).toFixed(2);
  const bet = () => C.baseBet * C.multipliers[state.multIndex];
  const mult = () => C.multipliers[state.multIndex];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function fit() {
    const stage = $("stage");
    const s = Math.min(innerWidth / 963, innerHeight / 1113);
    stage.style.transform = `scale(${s})`;
    stage.style.left = (innerWidth - 963 * s) / 2 + "px";
    stage.style.top = (innerHeight - 1113 * s) / 2 + "px";
    // ocean art fills the space either side of the machine
    const sideW = Math.ceil((innerWidth - 963 * s) / 2) + 2 + "px";
    document.querySelectorAll(".side").forEach((el) => (el.style.width = sideW));
  }

  function renderMeters(winShown) {
    $("credit").textContent = money(state.credits);
    $("bet").textContent = money(bet());
    if (winShown !== undefined) $("win").textContent = winShown ? money(winShown) : "";
    $("meter-mother").innerHTML = `<span>${money(Math.floor(state.motherLode))}</span>`;
    $("meter-trap").innerHTML = `<span>${money(Math.floor(state.fullTrap))}</span>`;
    $("btn-bet-down").disabled = busy || state.multIndex === 0;
    $("btn-bet-up").disabled = busy || state.multIndex === C.multipliers.length - 1;
    $("btn-max").disabled = busy;
    $("test-col").hidden = !state.testMode;
    $("btn-test").disabled = busy;
    $("btn-test-wheel").disabled = busy;
  }

  function setMessage(text) {
    $("message").textContent = text;
  }

  function idleMessage() {
    setMessage(`PLAYING 720 WAYS WITH A BET MULTIPLIER OF ${mult()}...GOOD LUCK!`);
  }

  function tickClock() {
    $("clock").textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function showOverlay(html, ms) {
    const o = $("overlay");
    o.innerHTML = html;
    o.classList.add("show");
    return sleep(ms).then(() => o.classList.remove("show"));
  }

  // ---------- win presentation ----------
  function stopWinCycle() {
    if (winCycle) clearInterval(winCycle);
    winCycle = null;
    reels.clearHighlights();
  }

  function startWinCycle(wins) {
    let i = 0;
    const all = wins.flatMap((w) => w.cells);
    reels.highlight(all);
    const step = () => {
      const w = wins[i % wins.length];
      reels.highlight(w.cells);
      setMessage(`${w.length} × ${LM.SYMBOLS[w.sym].name.toUpperCase()}  ·  ${w.ways} WAY${w.ways > 1 ? "S" : ""}  ·  PAYS ${money(w.pay)}`);
      i++;
    };
    winCycle = setInterval(step, 1500);
    setTimeout(step, 900);
  }

  /** Count the WIN meter up and add to credits. Resolves when done (or skipped). */
  function rollup(amount) {
    const startCredits = state.credits;
    const ratio = amount / bet();
    const duration = Math.min(7000, Math.max(500, ratio * 140));
    const t0 = performance.now();
    let lastTick = 0;
    $("win").classList.add("rolling");
    return new Promise((resolve) => {
      const finish = () => {
        state.credits = startCredits + amount;
        $("win").classList.remove("rolling");
        renderMeters(amount);
        rolling = null;
        resolve();
      };
      rolling = finish;
      const frame = (now) => {
        if (!rolling) return;
        const t = Math.min(1, (now - t0) / duration);
        const shown = Math.floor(amount * t);
        if (now - lastTick > 75 && t < 1) {
          lastTick = now;
          LM.sound.play("winTick", t);
        }
        state.credits = startCredits + shown;
        renderMeters(shown);
        if (t < 1) requestAnimationFrame(frame);
        else finish();
      };
      requestAnimationFrame(frame);
    });
  }

  async function celebrate(amount) {
    const x = amount / bet();
    if (x < 15) {
      LM.sound.play("win");
      return rollup(amount);
    }
    // The title grows while the win counts up: BIG -> HUGE -> MEGA, each with more coins
    const tiers = [
      [0, "BIG WIN!", 1],
      [40, "HUGE WIN!", 2],
      [100, "MEGA WIN!", 3],
    ];
    const startCredits = state.credits;
    const o = $("overlay");
    o.innerHTML = `<div class="big" id="bigwin-title"></div><div class="sub" id="bigwin-amt"></div>`;
    o.classList.add("show");
    const title = $("bigwin-title");
    const amt = $("bigwin-amt");
    let tier = -1;
    const sync = setInterval(() => {
      amt.textContent = $("win").textContent;
      const shown = (state.credits - startCredits) / bet();
      const t = tiers.filter(([min]) => shown >= min).length - 1;
      if (t > tier) {
        tier = t;
        title.textContent = tiers[t][1];
        title.classList.remove("tier-up");
        void title.offsetWidth; // restart the pop animation
        title.classList.add("tier-up");
        LM.sound.play("bigWin");
        LM.fx.coinShower(2500, tiers[t][2]);
      }
    }, 50);
    await rollup(amount);
    clearInterval(sync);
    amt.textContent = money(amount);
    LM.fx.coinShower(800, tiers[Math.max(0, tier)][2]);
    await sleep(1400);
    o.classList.remove("show");
  }

  // ---------- bonus anticipation ----------
  /**
   * Which reels tease a bonus, decided from the result before the reels stop:
   * teases[r] = { ms, level (1-3, how big the music gets), kind, text, hit(r) } or undefined.
   *  - Larry fills reel 2: reel 3 teases. Reels 2 and 3 full: reel 4 teases, longer and louder.
   *  - Big Wheel symbols on 2+ reels in a row: the next reel teases (more spins at stake each time).
   */
  function anticipation(grid, full) {
    const teases = [];
    const hasWheel = (r) => grid[r].includes("bigwheel");
    if (full.includes(1)) {
      teases[2] = { ms: 1500, level: 1, kind: "larry", text: "LUCKY LARRY... BUOY BONUS CHANCE!", hit: () => full.includes(2) };
      if (full.includes(2)) teases[3] = { ms: 2900, level: 3, kind: "larry", text: "ONE MORE LARRY FOR THE BUOY BONUS!", hit: () => full.includes(3) };
    }
    let run = 0;
    for (let r = 0; r < 4; r++) {
      run = hasWheel(r) ? run + 1 : 0;
      if (run >= 2 && !teases[r + 1]) {
        const level = Math.min(3, run - 1);
        teases[r + 1] = {
          secured: run >= 3, // the wheel is already won; this reel only adds spins
          ms: [0, 0, 1700, 2300, 2700][run],
          level,
          kind: "wheel",
          text: run === 2 ? "BIG WHEEL BONUS CHANCE!" : `BIG WHEEL... GOING FOR ${run - 1} SPINS!`,
          hit: (rr) => hasWheel(rr),
        };
      }
    }
    return teases;
  }

  // ---------- autoplay ----------
  async function startAuto(n = state.auto.spins) {
    if (busy || autoRunning) return;
    autoLeft = n;
    autoRunning = true;
    LM.sound.play("click");
    while (autoLeft > 0) {
      if (!$("modal").hidden) break;
      if (state.credits < C.baseBet) {
        stopAuto();
        return openRefill();
      }
      autoLeft--;
      const bonusesBefore = state.stats.bonuses + state.stats.wheels;
      await spin(true);
      if (state.auto.stopAfterBonus && state.stats.bonuses + state.stats.wheels > bonusesBefore) break;
      renderAuto();
      if (autoLeft > 0) await sleep(state.turbo ? 250 : 500);
      // a quick press during the pause also finishes a count-up first
      if (rolling) rolling();
    }
    stopAuto();
  }

  function stopAuto() {
    autoLeft = 0;
    autoRunning = false;
    renderAuto();
  }

  function renderAuto() {
    const btn = $("btn-spin");
    btn.classList.toggle("auto", autoLeft > 0);
    if (!busy || btn.textContent.startsWith("AUTO")) btn.textContent = autoLeft > 0 ? `AUTO ${autoLeft}` : "PLAY";
  }

  // ---------- spinning ----------
  async function spin(fromAuto = false) {
    if (autoRunning && fromAuto !== true) {
      // PLAY / space during autoplay stops it (and hurries the reels, or hands a bonus back)
      stopAuto();
      if (busy) reels.hurry();
      return;
    }
    if (rolling) return rolling(); // first press finishes the count-up
    if (busy) {
      reels.hurry(); // STOP
      return;
    }
    if (state.credits < bet()) {
      if (state.credits >= C.baseBet) {
        // drop to the highest bet we can afford
        while (state.multIndex > 0 && state.credits < bet()) state.multIndex--;
        renderMeters();
      } else {
        return openRefill();
      }
    }

    busy = true;
    stopWinCycle();
    reels.clearLarry();
    state.credits -= bet();
    state.motherLode += bet() * C.progressives.motherLode.rate;
    state.fullTrap += bet() * C.progressives.fullTrap.rate;
    state.stats.spins++;
    state.stats.bet += bet();
    renderMeters(0);
    LM.sound.play("spinStart");
    LM.sound.reelLoop(true);
    $("btn-spin").textContent = "STOP";
    $("btn-spin").classList.add("stop");
    idleMessage();

    const { grid, stops } = LM.engine.spin(strips);
    const result = LM.engine.evaluate(grid, mult());
    const bonus = LM.engine.isBuoyBonus(grid);
    const wheel = LM.engine.bigWheel(grid);

    // Anticipation: a reel that could still complete a bonus keeps rolling (fast) for longer,
    // glows, and tension music builds. Every tease adds to the reels after it, so they stop in order.
    const full = LM.engine.larryFullReels(grid);
    const teases = anticipation(grid, full);
    const speed = state.turbo ? 0.5 : 1;
    const extraMs = [];
    let added = 0;
    for (let r = 0; r < 5; r++) {
      if (teases[r]) added += teases[r].ms * speed;
      extraMs.push(added);
    }
    const decelMs = teases.map((t) => (t ? 1100 * speed : 0));
    let wheelRun = 0;

    await reels.spin(grid, strips, stops, {
      baseMs: 760 * speed,
      staggerMs: 250 * speed,
      extraMs,
      decelMs,
      onReelStop(r) {
        LM.sound.play("reelStop", r);
        if (r === 4) LM.sound.reelLoop(false);
        if (r >= 1 && r <= 3 && full.includes(r)) {
          reels.setLarryFull(r, true);
          LM.sound.play("larryReel", r - 1);
        }
        // Big Wheel symbols ring as they land, higher for each reel in a row
        if (grid[r].includes("bigwheel")) {
          wheelRun++;
          grid[r].forEach((x, k) => x === "bigwheel" && reels.setGlow(r, k, true));
          LM.sound.play("scatterLand", Math.min(5, wheelRun));
        } else wheelRun = 0;
        // finishing a tease
        if (teases[r]) {
          reels.setAnticipation(r, false);
          const hit = teases[r].hit(r);
          if (!teases[r + 1]) {
            LM.sound.tension(0);
            if (hit) LM.sound.play("teaseHit");
            else if (!teases[r].secured) {
              LM.sound.play("teaseMiss");
              idleMessage();
            }
          }
        }
        // starting the next one
        const next = teases[r + 1];
        if (next) {
          reels.setAnticipation(r + 1, true, next.kind);
          LM.sound.tension(next.level);
          setMessage(next.text);
        }
      },
    });
    reels.clearGlow();
    LM.sound.tension(0);
    LM.sound.reelLoop(false);
    $("btn-spin").textContent = autoLeft > 0 ? `AUTO ${autoLeft}` : "PLAY";
    $("btn-spin").classList.remove("stop");

    if (result.total > 0) {
      state.stats.won += result.total;
      state.stats.biggest = Math.max(state.stats.biggest, result.total);
      reels.highlight(result.wins.flatMap((w) => w.cells));
      setMessage(`WIN ${money(result.total)}`);
      await celebrate(result.total);
      startWinCycle(result.wins);
    }

    if (wheel.spins) await bigWheelBonus(wheel);
    if (bonus) await buoyBonus();

    busy = false;
    renderMeters();
    save();
  }

  // ---------- Buoy Bonus ----------
  const TOP_IMG = $("top-img").src;
  const BASE_IMG = $("base-img").src;
  function setTop(src) {
    $("top-img").src = src ? LM.url(src) : TOP_IMG;
    document.querySelectorAll(".meter").forEach((m) => (m.style.display = src ? "none" : ""));
  }

  /** Test mode: land Lucky Larry on reels 2-4 right away and start the bonus. Free, not counted in stats. */
  async function testBonus() {
    if (busy || rolling || !state.testMode) return;
    busy = true;
    stopWinCycle();
    const grid = LM.engine.spin(strips).grid;
    [1, 2, 3].forEach((r) => (grid[r] = grid[r].map(() => "larry")));
    reels.show(grid);
    [1, 2, 3].forEach((r) => reels.setLarryFull(r, true));
    LM.sound.play("larryReel", 2);
    renderMeters(0);
    await sleep(700);
    await buoyBonus(true);
    busy = false;
    renderMeters();
    save();
  }

  /** Test mode: land three Big Wheel symbols (or 4/5 now and then) and start the wheel. */
  async function testWheel() {
    if (busy || rolling || !state.testMode) return;
    busy = true;
    stopWinCycle();
    const grid = LM.engine.spin(strips).grid;
    const reelsWith = 3 + (Math.random() < 0.3 ? 1 : 0) + (Math.random() < 0.1 ? 1 : 0);
    for (let r = 0; r < reelsWith; r++) grid[r][Math.floor(Math.random() * grid[r].length)] = "bigwheel";
    reels.show(grid);
    renderMeters(0);
    await bigWheelBonus(LM.engine.bigWheel(grid), true);
    busy = false;
    renderMeters();
    save();
  }

  /** Pay out a progressive meter (all of it at max bet, a share at lower bets) and reseed it. */
  function takeProgressive(type, test) {
    const key = type === "mother" ? "motherLode" : "fullTrap";
    const won = Math.floor((state[key] * mult()) / C.multipliers[C.multipliers.length - 1]);
    state[key] = C.progressives[key].seed;
    if (!test) state.stats.jackpots++;
    renderMeters();
    return won;
  }

  async function bigWheelBonus(wheel, test = false) {
    if (!test) state.stats.wheels++;
    stopWinCycle();
    reels.highlight(wheel.cells);
    setMessage("BIG WHEEL BONUS!");
    LM.sound.play("larryReel", 2);
    await sleep(1400);
    reels.clearHighlights();
    const { credits, buoyBonuses } = await LM.BigWheel.run({
      layer: $("bonus-layer"),
      topLayer: $("top-screen"),
      spins: wheel.spins,
      mult: mult(),
      speed: state.turbo ? 0.6 : 1,
      money,
      setMessage,
      showWin: (c) => renderMeters(c),
      progressive: (type) => takeProgressive(type, test),
    });
    if (!test) {
      state.stats.won += credits;
      state.stats.biggest = Math.max(state.stats.biggest, credits);
    }
    if (credits) {
      setMessage(`BIG WHEEL BONUS WIN ${money(credits)}`);
      await rollup(credits);
    }
    save();
    for (let i = 0; i < buoyBonuses; i++) await buoyBonus(test);
  }

  async function buoyBonus(test = false) {
    if (!test) state.stats.bonuses++;
    stopWinCycle();
    LM.Bonus.preload(); // start loading Larry's animations during the splash
    LM.sound.play("bonus");
    await showOverlay(`<img src="assets/ui/bonus_initiated.png" alt="Bonus Initiated!">`, 2600);
    LM.sound.music(true);
    reels.clearLarry();
    setMessage("BUOY BONUS");
    const won = await LM.Bonus.run({
      layer: $("bonus-layer"),
      overLayer: $("bonus-layer"),
      topLayer: $("top-screen"),
      reels,
      strips,
      speed: state.turbo ? 0.5 : 1,
      mult: mult(),
      level: state.level,
      money,
      setTop,
      setMessage,
      setBottom: (src) => ($("base-img").src = src ? LM.url(src) : BASE_IMG),
      showWin: (credits) => renderMeters(credits),
    });
    LM.sound.music(false);
    if (!test) {
      state.stats.won += won;
      state.stats.biggest = Math.max(state.stats.biggest, won);
    }
    setMessage(`BUOY BONUS WIN ${money(won)}`);
    await rollup(won);
    save();
  }

  // ---------- sound ----------
  function applySound() {
    LM.sound.set(state.sound);
    $("btn-sound").classList.toggle("muted", !state.sound.on);
    $("btn-sound").textContent = state.sound.on ? "🔊" : "🔇";
  }

  function toggleSound() {
    state.sound.on = !state.sound.on;
    applySound();
    save();
    LM.sound.play("click");
  }

  // ---------- betting ----------
  function changeBet(delta) {
    if (busy) return;
    state.multIndex = Math.max(0, Math.min(C.multipliers.length - 1, state.multIndex + delta));
    LM.sound.play("bet");
    renderMeters();
    idleMessage();
    save();
  }

  // ---------- dialogs ----------
  function openModal(html, onOpen) {
    $("modal-box").innerHTML = html;
    $("modal").hidden = false;
    onOpen && onOpen($("modal-box"));
  }
  function closeModal() {
    $("modal").hidden = true;
  }

  function openRefill() {
    openModal(
      `<h2>Out of credits</h2>
       <p style="text-align:center">It's all play money. Top up and keep fishing!</p>
       <div class="actions"><button class="btn green" id="refill-go">REFILL ${money(state.startingCredits)}</button></div>`,
      () => {
        $("refill-go").onclick = () => {
          state.credits = state.startingCredits;
          renderMeters();
          save();
          closeModal();
        };
      }
    );
  }

  function estimateText(level) {
    const s = LM.engine.simulate(level, 60000, 11);
    return `Pays back about <b>${Math.round(s.totalReturn * 100)}%</b> of what you bet ·
      a win on about <b>1 in ${Math.round(1 / s.hitRate)}</b> spins ·
      Buoy Bonus about <b>every ${Math.round(s.bonusEvery)}</b> spins (average ${Math.round(s.avgBonus)}× bet) ·
      Big Wheel about <b>every ${Math.round(s.wheelEvery)}</b> spins.
      <div class="note">Measured by simulating 60,000 spins. Over 100% means her credits tend to grow.</div>`;
  }

  function openSettings() {
    if (busy) return;
    const levels = Object.entries(LM.GENEROSITY)
      .map(
        ([lv, g]) =>
          `<label><input type="radio" name="level" value="${lv}" ${+lv === state.level ? "checked" : ""}><b>${lv}</b>${g.label}</label>`
      )
      .join("");
    const st = state.stats;
    const amounts = [2000, 5000, 10000, 50000, 100000];
    openModal(
      `<h2>Settings</h2>
       <h3>Generosity</h3>
       <div class="levels">${levels}</div>
       <div class="estimate" id="estimate">Measuring…</div>

       <h3>Sound</h3>
       <div class="row">
         <label><input type="checkbox" id="snd-on" ${state.sound.on ? "checked" : ""}> Sound effects</label>
         <label><input type="checkbox" id="snd-music" ${state.sound.music ? "checked" : ""}> Bonus music</label>
         <label>Volume <input type="range" id="snd-vol" min="0" max="1" step="0.05" value="${state.sound.volume}"></label>
         <label>Music <input type="range" id="snd-mvol" min="0" max="1" step="0.05" value="${state.sound.musicVolume}"></label>
         <button class="plain" id="snd-test">Test sound</button>
       </div>

       <h3>Spin speed</h3>
       <div class="row">
         <label><input type="radio" name="speed" value="normal" ${state.turbo ? "" : "checked"}> Normal</label>
         <label><input type="radio" name="speed" value="turbo" ${state.turbo ? "checked" : ""}> Turbo</label>
       </div>

       <h3>Autoplay</h3>
       <div class="row">
         <select id="auto-spins">${[10, 25, 50, 100, 250]
           .map((n) => `<option value="${n}" ${n === state.auto.spins ? "selected" : ""}>${n} spins</option>`)
           .join("")}</select>
         <label><input type="checkbox" id="auto-stop" ${state.auto.stopAfterBonus ? "checked" : ""}> Stop after a bonus</label>
         <button class="plain" id="auto-go">Start autoplay</button>
       </div>
       <p class="note">Bonuses play themselves too, with random picks. Press PLAY or the space bar to stop autoplay;
       during a bonus that hands the remaining picks back to her. Shortcut: A key starts autoplay.</p>

       <h3>Screen</h3>
       <div class="row"><button class="plain" id="fullscreen">Full screen on/off</button> <span class="note">Shortcut: F key</span></div>

       <h3>Test mode</h3>
       <div class="row">
         <label><input type="checkbox" id="test-mode" ${state.testMode ? "checked" : ""}> Show <b>TEST BONUS</b> and <b>TEST WHEEL</b> buttons that start the Buoy Bonus or the Big Wheel instantly</label>
       </div>
       <p class="note">Test bonuses are free and pay out like normal ones, but they aren't counted in the stats. Shortcuts: B and W keys.</p>

       <h3>Credits</h3>
       <div class="row">
         Refill amount
         <select id="start-amt">${amounts
           .map((a) => `<option value="${a}" ${a === state.startingCredits ? "selected" : ""}>${money(a)}</option>`)
           .join("")}</select>
         <button class="plain" id="refill-now">Refill now</button>
       </div>

       <h3>Stats</h3>
       <div class="stats">
         <span>Spins</span><span>${st.spins.toLocaleString()}</span>
         <span>Total bet</span><span>${money(st.bet)}</span>
         <span>Total won</span><span>${money(st.won)}</span>
         <span>Biggest win</span><span>${money(st.biggest)}</span>
         <span>Buoy Bonuses</span><span>${st.bonuses}</span>
         <span>Big Wheel Bonuses</span><span>${st.wheels}</span>
         <span>Progressives won</span><span>${st.jackpots}</span>
       </div>
       <div class="row"><button class="plain" id="reset-stats">Reset stats</button></div>

       <div class="actions"><button class="btn green" id="settings-done">DONE</button></div>`,
      (box) => {
        const est = $("estimate");
        const measure = (lv) => {
          est.textContent = "Measuring…";
          setTimeout(() => (est.innerHTML = estimateText(lv)), 30);
        };
        measure(state.level);
        box.querySelectorAll('input[name="level"]').forEach((el) =>
          el.addEventListener("change", () => {
            state.level = +el.value;
            strips = LM.engine.buildStrips(state.level);
            measure(state.level);
            save();
          })
        );
        box.querySelectorAll('input[name="speed"]').forEach((el) =>
          el.addEventListener("change", () => {
            state.turbo = el.value === "turbo";
            save();
          })
        );
        $("test-mode").onchange = (e) => {
          state.testMode = e.target.checked;
          renderMeters();
          save();
        };
        const sndChange = () => {
          state.sound = {
            on: $("snd-on").checked,
            music: $("snd-music").checked,
            volume: +$("snd-vol").value,
            musicVolume: +$("snd-mvol").value,
          };
          applySound();
          save();
        };
        ["snd-on", "snd-music"].forEach((id) => ($(id).onchange = sndChange));
        $("snd-vol").oninput = sndChange;
        $("snd-mvol").oninput = sndChange;
        $("auto-spins").onchange = (e) => {
          state.auto.spins = +e.target.value;
          save();
        };
        $("auto-stop").onchange = (e) => {
          state.auto.stopAfterBonus = e.target.checked;
          save();
        };
        $("auto-go").onclick = () => {
          closeModal();
          startAuto();
        };
        $("fullscreen").onclick = toggleFullscreen;
        $("snd-test").onclick = () => LM.sound.play("win");
        $("start-amt").onchange = (e) => {
          state.startingCredits = +e.target.value;
          save();
        };
        $("refill-now").onclick = () => {
          state.credits = state.startingCredits;
          renderMeters();
          save();
          $("refill-now").textContent = "Done ✓";
        };
        $("reset-stats").onclick = () => {
          state.stats = structuredClone(defaults.stats);
          save();
          openSettings();
        };
        $("settings-done").onclick = closeModal;
      }
    );
  }

  function openRules() {
    if (busy) return;
    const row = (s) => {
      const p = LM.SYMBOLS[s].pays;
      return `<tr><td><img src="${LM.SYMBOLS[s].img}" width="79" height="44" alt=""></td><td>${LM.SYMBOLS[s].name}</td>
        <td>${[5, 4, 3].map((n) => (p[n] ? `${n} = ${p[n]}` : "")).filter(Boolean).join(" · ")}</td></tr>`;
    };
    openModal(
      `<h2>Game Rules</h2>
       <p>720 ways: matching symbols on neighbouring reels, starting from the left reel, pay in any position.
       Every way pays the amount below × your bet multiplier.</p>
       <table style="border-spacing:8px 4px">${LM.PAY_SYMBOLS.map(row).join("")}</table>
       <h3>Wild</h3><p>The Lobstermania 3 logo is wild and stands in for every symbol except Lucky Larry and Big Wheel Bonus.</p>
       <h3>Buoy Bonus</h3><p>Lucky Larry appears on reels 2, 3 and 4 only. Fill all three reels with Larry to start the Buoy Bonus.</p>
       <h3>Big Wheel Bonus</h3><p>3, 4 or 5 <b>Big Wheel Bonus</b> symbols on adjacent reels give 1, 2 or 3 spins of the Big Wheel.
       Drag on the screen (or press space) to spin. The wheel pays credits × your bet multiplier, a Buoy Bonus,
       or one of the progressives.</p>
       <h3>Progressives</h3><p>The Mother Lode and Full Trap meters grow a little with every bet. Win one on the Big Wheel:
       at max bet you get the whole meter, at lower bets a share (bet multiplier 2 wins 2/5 of it). The meter then starts again from
       ${money(C.progressives.motherLode.seed)} / ${money(C.progressives.fullTrap.seed)}.</p>
       <h3>Controls</h3><p>Space bar = spin / stop · Arrow keys up/down = change bet · A = autoplay · F = full screen · M = sound on/off · Esc = close this window</p>
       <p class="note">A just-for-fun home remake. No real money.</p>
       <div class="actions"><button class="btn green" id="rules-done">OK</button></div>`,
      () => ($("rules-done").onclick = closeModal)
    );
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
  }

  // ---------- start ----------
  function init() {
    reels = new LM.ReelSet($("reels"), $("cells"));
    reels.show(LM.engine.spin(strips).grid);

    $("btn-spin").onclick = () => spin();
    $("btn-bet-down").onclick = () => changeBet(-1);
    $("btn-bet-up").onclick = () => changeBet(1);
    $("btn-max").onclick = () => changeBet(C.multipliers.length);
    $("btn-test").onclick = testBonus;
    $("btn-test-wheel").onclick = testWheel;
    $("btn-menu").onclick = () => {
      LM.sound.play("click");
      openSettings();
    };
    $("btn-info").onclick = () => {
      LM.sound.play("click");
      openRules();
    };
    $("btn-sound").onclick = toggleSound;
    applySound();
    $("modal").addEventListener("click", (e) => e.target.id === "modal" && closeModal());

    addEventListener("keydown", (e) => {
      if (!$("modal").hidden) {
        if (e.key === "Escape") closeModal();
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        spin();
      } else if (e.key === "a" || e.key === "A") {
        if (autoRunning) stopAuto();
        else startAuto();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "ArrowUp") changeBet(1);
      else if (e.key === "ArrowDown") changeBet(-1);
      else if (e.key === "b" || e.key === "B") testBonus();
      else if (e.key === "w" || e.key === "W") testWheel();
      else if (e.key === "m" || e.key === "M") toggleSound();
    });

    addEventListener("resize", fit);
    fit();
    tickClock();
    setInterval(tickClock, 15000);
    renderMeters(0);
    idleMessage();
  }

  init();
})();
