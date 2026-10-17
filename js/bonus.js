/* The Buoy Bonus: Pick a Bonus -> Pick a Lobster -> Classic (or Free Games).
   Artwork and Larry's animations come from the promo video (see tools/extract_bonus.py). */
(function () {
  const B = LM.BONUS;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const A = "assets/bonus/";

  // Positions on the bottom screen (963 x 494 design pixels), measured from the promo.
  const BUOY_X = [97, 197, 292, 395, 485, 580, 678, 770, 870];
  const LOBSTER_X = [245, 480, 710];
  const ANIM = { x: 90, y: 0, w: 873, h: 335, fps: 12 };
  const CLIPS = { haul: 28, pull: 8, giant: 61 };

  function el(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }

  /**
   * Autoplay: when it's on, click one of `getTargets()` at random after `delay` ms, so the
   * bonus plays itself. Only targets that still have a click handler count, so it stops by
   * itself once the player picks. Turning autoplay off mid-bonus hands the picks back.
   */
  function autoClick(getTargets, delay = 1300) {
    const start = performance.now();
    const timer = setInterval(() => {
      const list = getTargets().filter((e) => e && e.onclick && e.isConnected);
      if (!list.length) return clearInterval(timer);
      if (!LM.autoplay.active() || performance.now() - start < delay) return;
      clearInterval(timer);
      list[Math.floor(Math.random() * list.length)].click();
    }, 200);
  }

  function img(src, cls, parent) {
    const i = el("img", cls, parent);
    i.src = LM.url(src);
    i.alt = "";
    i.draggable = false;
    return i;
  }

  // ---------- Larry's animation frames (loaded once, on first bonus) ----------
  const frames = {};
  let preloadPromise;
  function preload() {
    if (preloadPromise) return preloadPromise;
    const all = [];
    const load = (src) =>
      new Promise((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(i);
        i.src = LM.url(src);
        all.push(i);
      });
    preloadPromise = Promise.all([
      ...Object.entries(CLIPS).map(async ([name, n]) => {
        frames[name] = await Promise.all(
          Array.from({ length: n }, (_, k) => load(`${A}anim/${name}_${String(k).padStart(2, "0")}.jpg`))
        );
      }),
      load(A + "anim/idle_start.jpg").then((i) => (frames.idle_start = i)),
      load(A + "anim/idle_crate.jpg").then((i) => (frames.idle_crate = i)),
    ]);
    return preloadPromise;
  }

  // ---------- The boat with nine buoys ----------
  class BoatScene {
    constructor(parent) {
      this.root = el("div", "boat-scene", parent);
      img(A + "boat.jpg", "bg", this.root);
      this.canvas = el("canvas", "larry", this.root);
      this.canvas.width = ANIM.w;
      this.canvas.height = ANIM.h;
      this.ctx = this.canvas.getContext("2d");
      this.draw(frames.idle_start);

      this.picksEl = el("div", "picks-left", this.root);
      this.prizeEl = el("div", "larry-prize", this.root);
      this.caption = el("div", "boat-caption", this.root);

      this.buoys = BUOY_X.map((x, i) => {
        const b = el("div", "buoy", this.root);
        b.style.left = x - 47 + "px";
        const ghost = img(A + "ghost.png", "ghost", b);
        const value = el("div", "buoy-value lm-num", b);
        const spot = el("button", "buoy-spot", b);
        spot.setAttribute("aria-label", `Buoy ${i + 1}`);
        return { el: b, ghost, value, spot, picked: false, total: 0 };
      });
    }

    draw(image) {
      if (image && image.naturalWidth) this.ctx.drawImage(image, 0, 0, ANIM.w, ANIM.h);
    }

    async play(name, { reverse = false, onFrame } = {}) {
      const list = reverse ? frames[name].slice().reverse() : frames[name];
      for (let k = 0; k < list.length; k++) {
        this.draw(list[k]);
        onFrame && onFrame(k);
        await sleep(1000 / ANIM.fps);
      }
    }

    setPicks(n) {
      this.picksEl.textContent = n;
    }

    /** Let the player pick an unpicked buoy; resolves with its index. */
    choose() {
      return new Promise((resolve) => {
        this.root.classList.add("picking");
        this.buoys.forEach((b, i) => {
          b.spot.onclick = () => {
            if (b.picked) return;
            this.root.classList.remove("picking");
            this.buoys.forEach((x) => (x.spot.onclick = null));
            LM.sound.play("plop");
            resolve(i);
          };
        });
        autoClick(() => this.buoys.filter((b) => !b.picked).map((b) => b.spot));
      });
    }

    markPicked(i) {
      const b = this.buoys[i];
      b.picked = true;
      b.el.classList.add("picked");
    }

    /** Buoy values are shown in credits, like the machine. */
    setValue(i, credits) {
      const b = this.buoys[i];
      b.total = credits;
      b.value.textContent = credits ? credits.toLocaleString() : "";
    }

    /** Value floating next to Larry while he shows his catch. */
    showPrize(text, giant) {
      this.prizeEl.textContent = text;
      this.prizeEl.className = "larry-prize lm-num show" + (giant ? " giant" : "");
    }
    hidePrize() {
      this.prizeEl.className = "larry-prize lm-num";
    }
  }

  // ---------- Screens ----------
  function screen(ctx, bgSrc) {
    const s = el("div", "bonus-screen", ctx.layer);
    if (bgSrc) img(bgSrc, "bg", s);
    return s;
  }

  async function pickBonus(ctx) {
    const s = screen(ctx, A + "pick_bonus.jpg");
    const opts = [
      { key: "classic", x: 160, w: 295 },
      { key: "free", x: 505, w: 300 },
    ];
    const choice = await new Promise((resolve) => {
      opts.forEach((o) => {
        const b = el("button", "pick-circle", s);
        Object.assign(b.style, { left: o.x + "px", top: "100px", width: o.w + "px", height: "285px" });
        b.setAttribute("aria-label", o.key === "classic" ? "Buoy Bonus Classic" : "Buoy Bonus Free Games");
        const ready = o.key === "classic" || LM.freeGames;
        if (ready)
          b.onclick = () => {
            LM.sound.play("pick");
            resolve(o.key);
          };
        else {
          b.classList.add("not-chosen", "soon");
          el("div", "soon-label", b, "COMING<br>SOON");
        }
        o.btn = b;
      });
      autoClick(() => opts.map((o) => o.btn), 1800);
    });
    opts.forEach((o) => o.btn.classList.add(o.key === choice ? "chosen" : "not-chosen"));
    LM.sound.play("reveal");
    s.querySelectorAll("button").forEach((b) => (b.onclick = null));
    await sleep(1300);
    s.remove();
    return choice;
  }

  async function pickLobster(ctx) {
    const s = screen(ctx, A + "pick_lobster.jpg");
    const values = ctx.roll.lobsters;
    const picked = await new Promise((resolve) => {
      LOBSTER_X.forEach((x, i) => {
        const b = el("button", "pick-lobster", s);
        Object.assign(b.style, { left: x - 100 + "px" });
        b.setAttribute("aria-label", `Lobster ${i + 1}`);
        b.onclick = () => {
          LM.sound.play("pick");
          resolve(i);
        };
      });
      autoClick(() => [...s.querySelectorAll(".pick-lobster")]);
    });
    s.querySelectorAll("button").forEach((b) => b.remove());
    // Reveal: picked lobster lights up, the others go grey and show what they had.
    img(A + "good_luck.png", "good-luck", s);
    const order = [picked, ...[0, 1, 2].filter((i) => i !== picked)];
    for (const i of order) {
      const lit = i === picked;
      const slot = el("div", "lobster-reveal" + (lit ? " lit" : ""), s);
      slot.style.left = LOBSTER_X[i] - 105 + "px";
      img(A + (lit ? "lobster_lit.png" : "lobster_dim.png"), "", slot);
      el("div", "lobster-label", slot, `<b>${values[i]}</b> BUOY<br>PICKS`);
      LM.sound.play(lit ? "reveal" : "click");
      await sleep(lit ? 900 : 450);
    }
    await sleep(1600);
    s.remove();
    return values[picked];
  }

  async function totalBoard(ctx, credits) {
    const s = el("div", "total-board", ctx.layer);
    img(A + "total_board.png", "", s);
    const n = el("div", "total-amount lm-num", s, "0");
    s.classList.add("show");
    LM.sound.play("total");
    LM.fx.coinShower(Math.min(4000, 1200 + credits), credits > 3000 ? 2 : 1);
    let lastTick = 0;
    const t0 = performance.now();
    const dur = Math.min(2500, 600 + credits / 4);
    await new Promise((resolve) => {
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        n.textContent = Math.floor(credits * t).toLocaleString();
        if (now - lastTick > 70 && t < 1) {
          lastTick = now;
          LM.sound.play("winTick", t);
        }
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    await sleep(2200);
    s.remove();
  }

  // ---------- Buoy Bonus Classic ----------
  async function classic(ctx, picks) {
    ctx.setTop(A + "title_classic.jpg");
    const s = screen(ctx);
    const boat = new BoatScene(s);
    boat.setPicks(picks);
    boat.caption.textContent = "PICK BUOYS TO HAUL UP LARRY'S TRAPS!";
    let total = 0;
    let pickNo = 0;
    let crateOnDeck = false;

    while (picks > 0) {
      const i = await boat.choose();
      picks--;
      boat.setPicks(picks);
      boat.caption.textContent = "";
      boat.markPicked(i);
      boat.setValue(i, 0);

      // Larry hauls the trap up the first time, then pulls the catch out item by item.
      if (!crateOnDeck) {
        LM.sound.play("haul");
        await boat.play("haul");
        crateOnDeck = true;
      }
      const prize = ctx.roll.buoys[pickNo++];
      let buoyTotal = 0;
      for (const item of prize.items) {
        const value = item * ctx.mult;
        LM.sound.play("splash");
        await boat.play("pull");
        buoyTotal += value;
        LM.sound.play("prize");
        boat.showPrize(value.toLocaleString());
        boat.setValue(i, buoyTotal);
        await sleep(650);
        boat.hidePrize();
        await boat.play("pull", { reverse: true });
      }
      if (prize.giant) {
        const value = prize.giant * ctx.mult;
        LM.sound.play("giant");
        await boat.play("giant", {
          onFrame(k) {
            if (k === 2) {
              boat.showPrize(value.toLocaleString(), true);
              buoyTotal += value;
              boat.setValue(i, buoyTotal);
            }
          },
        });
        boat.hidePrize();
        boat.draw(frames.idle_crate);
      }
      total += buoyTotal;
      ctx.setMessage(`BUOY BONUS: ${total.toLocaleString()} CREDITS`);
      if (picks > 0) boat.caption.textContent = `${picks} PICK${picks > 1 ? "S" : ""} LEFT, PICK ANOTHER BUOY!`;
      await sleep(500);
    }
    await sleep(800);
    await totalBoard(ctx, total);
    s.remove();
    return total;
  }

  /**
   * Run the whole Buoy Bonus. ctx provides:
   *   layer (div over the bottom screen), mult, level, money(credits),
   *   setTop(src|null), setMessage(text)
   * Resolves with the credits won.
   */
  async function run(ctx) {
    const ready = preload();
    ctx.roll = LM.engine.rollClassic(ctx.level);
    const choice = await pickBonus(ctx);
    const picks = await pickLobster(ctx);
    await ready;
    let won;
    if (choice === "free" && LM.freeGames) won = await LM.freeGames(ctx, picks);
    else won = await classic(ctx, picks);
    ctx.setTop(null);
    return won;
  }

  LM.Bonus = { run, preload, BoatScene, frames, totalBoard, screen, el, img, sleep, autoClick };
})();
