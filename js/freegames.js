/* Buoy Bonus Free Games.
   Pick buoys -> rules -> 8 free spins on underwater reels. Treasure chests on 2+ adjacent reels
   make Larry (on the top screen) haul every picked buoy for an award: credits, wilds or a
   3x/5x multiplier or matching King Stacks on the next game, or extra free games.
   The whole outcome is rolled in advance by LM.engine.playFreeGames; this file only shows it. */
(function () {
  const { el, img, sleep, BoatScene, frames, totalBoard } = LM.Bonus;
  const F = "assets/freegames/";
  const A = "assets/bonus/";
  const FPS = 12;

  // Top-screen boat during free games: buoy slots and Larry's animation offset (measured from the promo)
  const TOP_BUOY_X = [82, 178, 280, 383, 482, 580, 682, 778, 878];
  const TOP_ANIM_Y = 60;

  const AWARD_TEXT = {
    credits: (a, ctx) => (a.credits * ctx.mult).toLocaleString(),
    wilds: (a) => `${a.count} WILDS<br>NEXT GAME`,
    multiplier: (a) => `${a.mult}× WINS<br>NEXT GAME`,
    extra: (a) => `+${a.games} FREE<br>GAMES`,
    king: () => `KING STACKS<br>NEXT GAME`,
  };

  // ---------- Top screen: Larry hauls the picked buoys ----------
  class TopBoat {
    constructor(parent, picked) {
      this.root = el("div", "fg-top", parent);
      img(F + "fg_top.jpg", "bg", this.root);
      this.canvas = el("canvas", "larry", this.root);
      this.canvas.width = 873;
      this.canvas.height = 335;
      this.canvas.style.top = TOP_ANIM_Y + "px";
      this.ctx = this.canvas.getContext("2d");
      this.draw(frames.idle_start);
      this.prize = el("div", "fg-top-prize", this.root);
      this.caption = el("div", "fg-top-caption", this.root);
      this.buoys = picked.map((slot) => {
        const b = el("div", "fg-top-buoy", this.root);
        b.style.left = TOP_BUOY_X[slot] - 47 + "px";
        img(A + "ghost.png", "ghost", b);
        const label = el("div", "buoy-value lm-num", b);
        return { el: b, label, credits: 0 };
      });
    }

    draw(image) {
      if (image && image.naturalWidth) this.ctx.drawImage(image, 0, 0, 873, 335);
    }

    async play(name, reverse) {
      const list = reverse ? frames[name].slice().reverse() : frames[name];
      for (const f of list) {
        this.draw(f);
        await sleep(1000 / FPS);
      }
    }

    showPrize(html, iconType) {
      this.prize.innerHTML = (iconType ? `<img src="${LM.url(F + "award_" + iconType + ".png")}" alt="">` : "") + `<span class="lm-num">${html}</span>`;
      this.prize.className = "fg-top-prize show" + (iconType ? " with-icon" : "");
    }

    hidePrize() {
      this.prize.className = "fg-top-prize";
    }

    /** Larry hauls buoy i and shows its award. */
    async haul(i, award, ctx) {
      const b = this.buoys[i];
      b.el.classList.add("hauling");
      LM.sound.play("splash");
      await this.play("pull");
      if (award.type === "credits") {
        LM.sound.play("prize");
        this.showPrize(AWARD_TEXT.credits(award, ctx));
        b.credits += award.credits * ctx.mult;
        b.label.textContent = b.credits.toLocaleString();
      } else {
        LM.sound.play("award");
        this.showPrize(AWARD_TEXT[award.type](award, ctx), award.type);
      }
      await sleep(1100);
      this.hidePrize();
      await this.play("pull", true);
      b.el.classList.remove("hauling");
    }
  }

  // ---------- Bottom screen pieces ----------
  function counters(layer) {
    const left = el("div", "fg-count fg-left", layer);
    const played = el("div", "fg-count fg-played", layer);
    return (l, p) => {
      left.textContent = l;
      played.textContent = p;
    };
  }

  function pendingSign(layer) {
    const sign = el("div", "fg-sign", layer);
    return (pending) => {
      const parts = [];
      if (pending.wilds) parts.push(["wilds", `${pending.wilds} WILDS`]);
      if (pending.mult) parts.push(["multiplier", `${pending.mult}× WINS`]);
      if (pending.king) parts.push(["king", `KING STACKS`]);
      sign.innerHTML = parts.length
        ? `<div class="fg-sign-title">NEXT GAME</div>` +
          parts.map(([t, txt]) => `<div class="fg-sign-row"><img src="${LM.url(F + "award_" + t + ".png")}" alt="">${txt}</div>`).join("")
        : "";
      sign.classList.toggle("show", parts.length > 0);
    };
  }

  function cellBox(r, k) {
    const p = LM.REEL_POS[r];
    return { x: p.x, y: p.y + k * LM.CONFIG.cellH };
  }

  function showChests(layer, chests) {
    return chests.map(([r, k]) => {
      const { x, y } = cellBox(r, k);
      const c = img(F + "chest.png", "fg-chest", layer);
      c.style.left = x + 58 + "px";
      c.style.top = y + 30 + "px";
      return c;
    });
  }

  async function banner(layer, html, ms) {
    const b = el("div", "fg-banner", layer, html);
    await sleep(ms);
    b.remove();
  }

  // ---------- Pick the buoys ----------
  async function pickBuoys(ctx, picks) {
    ctx.setTop(A + "title_free_games.jpg");
    const s = el("div", "bonus-screen", ctx.layer);
    const boat = new BoatScene(s);
    boat.setPicks(picks);
    const chosen = [];
    while (chosen.length < picks) {
      boat.caption.textContent = "PICK BUOYS TO REVEAL PRIZES IN THE FREE GAMES!";
      const i = await boat.choose();
      chosen.push(i);
      boat.buoys[i].picked = true;
      boat.buoys[i].el.classList.add("chosen");
      boat.setPicks(picks - chosen.length);
    }
    boat.caption.textContent = "GOOD LUCK!";
    LM.sound.play("haul");
    await boat.play("haul");
    await sleep(500);
    s.remove();
    return chosen.sort((a, b) => a - b);
  }

  async function rules(ctx) {
    const s = el("div", "bonus-screen fg-rules", ctx.layer);
    img(F + "fg_rules.jpg", "bg", s);
    await new Promise((resolve) => {
      const done = () => {
        LM.sound.play("click");
        removeEventListener("keydown", onKey, true);
        resolve();
      };
      const onKey = (e) => {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          done();
        }
      };
      s.onclick = done;
      addEventListener("keydown", onKey, true);
      setTimeout(done, 12000);
    });
    s.remove();
  }

  // ---------- The free games ----------
  async function freeGames(ctx, picks) {
    const script = LM.engine.playFreeGames(ctx.level, picks, ctx.strips);
    const picked = await pickBuoys(ctx, picks);
    await rules(ctx);

    // Switch the machine to free-games mode
    const prevGrid = ctx.reels.reels.map((r) => r.symbols.slice());
    LM.reelTheme = "fg";
    ctx.setBottom(F + "fg_bottom.jpg");
    $stage().classList.add("free-games");
    const top = new TopBoat(ctx.topLayer, picked);
    const layer = el("div", "fg-layer", ctx.overLayer);
    const setCounts = counters(layer);
    const setSign = pendingSign(layer);
    const chestLayer = el("div", "fg-chests", layer);
    const fxLayer = el("div", "fg-fx", layer);
    ctx.reels.show(prevGrid.map((col) => col.map((s) => (s === "larry" ? "gull" : s))));

    let total = 0;
    let pending = {};
    setCounts(LM.FREE_GAMES.spins, 0);
    ctx.showWin(0);

    for (let n = 0; n < script.spins.length; n++) {
      const sp = script.spins[n];
      chestLayer.replaceChildren();
      ctx.reels.clearHighlights();
      if (sp.applied.mult > 1) LM.sound.play("award");
      if (sp.applied.mult > 1) await banner(fxLayer, `<b>${sp.applied.mult}×</b><br>MULTIPLIER`, 1100);
      const before = n ? script.spins[n - 1].left : LM.FREE_GAMES.spins;
      setCounts(before - 1, n + 1);
      ctx.setMessage(`FREE GAME ${n + 1}`);
      await sleep(250);
      LM.sound.play("spinStart");
      LM.sound.reelLoop(true);
      await ctx.reels.spin(sp.grid, script.strips, sp.stops, {
        baseMs: 650 * ctx.speed,
        staggerMs: 230 * ctx.speed,
        onReelStop: (r) => LM.sound.play("reelStop", r),
      });
      LM.sound.reelLoop(false);
      pending = {};
      setSign(pending);

      // What the "next game" awards did to this spin
      if (sp.applied.king) {
        const sym = sp.applied.king.sym;
        for (let r = 0; r < sp.applied.king.reels; r++) ctx.reels.reels[r].el.classList.add("king");
        LM.sound.play("award");
        await banner(
          fxLayer,
          `<div>ALL KING STACKS ARE NOW<br><img src="${LM.url(LM.FREE_GAMES.img[sym])}" alt="${LM.SYMBOLS[sym].name}"></div>`,
          1500
        );
      }
      if (sp.applied.wildCells) {
        ctx.reels.highlight(sp.applied.wildCells);
        await sleep(900);
      }

      if (sp.win > 0) {
        const win = sp.win * ctx.mult;
        total += win;
        ctx.reels.highlight(sp.wins.flatMap((w) => w.cells));
        LM.sound.play(sp.win / 50 >= 15 ? "bigWin" : "win");
        ctx.setMessage(`FREE GAME WIN ${ctx.money(win)}${sp.mult > 1 ? ` (${sp.mult}× MULTIPLIER)` : ""}`);
        ctx.showWin(total);
        await sleep(1300);
      }
      ctx.reels.reels.forEach((r) => r.el.classList.remove("king"));

      // Treasure chests
      const chests = showChests(chestLayer, sp.chests);
      chests.forEach((_, i) => setTimeout(() => LM.sound.play("chest"), i * 90));
      if (chests.length) await sleep(500);
      if (sp.activated) {
        chests.forEach((c) => c.classList.add("glow"));
        LM.sound.play("lookUp");
        await banner(fxLayer, `<span class="up">⬆</span> LOOK UP! <span class="up">⬆</span>`, 1500);
        top.caption.textContent = "";
        for (let i = 0; i < sp.awards.length; i++) {
          const a = sp.awards[i];
          await top.haul(i, a, ctx);
          if (a.type === "credits") {
            total += a.credits * ctx.mult;
            ctx.showWin(total);
          } else if (a.type === "wilds") pending.wilds = (pending.wilds || 0) + a.count;
          else if (a.type === "multiplier") pending.mult = Math.max(pending.mult || 1, a.mult);
          else if (a.type === "king" && !pending.king) pending.king = a;
          else if (a.type === "extra") setCounts(sp.left, n + 1); // count jumps up
          setSign(pending);
        }
        if (sp.awards.bonusGame) await banner(fxLayer, "1 BONUS GAME<br>ADDED!", 1400);
        setCounts(sp.left, n + 1);
      }
      await sleep(400);
    }

    // No buoys activated during the games: Larry hauls them now for credits.
    if (script.endAwards.length) {
      top.caption.textContent = "LARRY HAULS YOUR BUOYS!";
      for (let i = 0; i < script.endAwards.length; i++) {
        await top.haul(i, { type: "credits", credits: script.endAwards[i] }, ctx);
        total += script.endAwards[i] * ctx.mult;
        ctx.showWin(total);
      }
    }
    chestLayer.replaceChildren();
    ctx.reels.clearHighlights();
    await sleep(600);

    await totalBoard({ layer: ctx.overLayer }, total);

    // Back to the base game
    layer.remove();
    top.root.remove();
    $stage().classList.remove("free-games");
    LM.reelTheme = "base";
    ctx.setBottom(null);
    ctx.reels.show(prevGrid);
    return total;
  }

  function $stage() {
    return document.getElementById("stage");
  }

  LM.freeGames = freeGames;
})();
