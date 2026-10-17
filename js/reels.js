/* Reel drawing and spin animation (requestAnimationFrame, so a spin can be cut short with STOP). */
(function () {
  const { rows, cellW, cellH } = LM.CONFIG;

  // Reel window positions on the bottom screen, measured from the machine (design pixels).
  const REEL_POS = [
    { x: 84, y: 98 },
    { x: 245, y: 53 },
    { x: 405, y: 10 },
    { x: 564, y: 53 },
    { x: 725, y: 98 },
  ];

  const FILLER = 18; // symbols that scroll past before the reel stops
  const BOUNCE_MS = 170;
  const BOUNCE_PX = 16;

  // "base" or "fg" (free games use underwater versions of the symbols)
  LM.reelTheme = "base";

  function tile(sym) {
    const img = new Image(cellW, cellH);
    const fg = LM.reelTheme === "fg" && LM.FREE_GAMES.img[sym];
    img.src = LM.url(fg || LM.SYMBOLS[sym].img);
    img.alt = LM.SYMBOLS[sym].name;
    img.draggable = false;
    return img;
  }

  class Reel {
    constructor(index, parent) {
      this.index = index;
      this.rows = rows[index];
      this.el = document.createElement("div");
      this.el.className = "reel";
      Object.assign(this.el.style, {
        left: REEL_POS[index].x + "px",
        top: REEL_POS[index].y + "px",
        height: this.rows * cellH + "px",
      });
      this.strip = document.createElement("div");
      this.strip.className = "strip";
      this.el.appendChild(this.strip);
      parent.appendChild(this.el);
      this.symbols = [];
    }

    show(symbols) {
      this.symbols = symbols.slice();
      this.strip.replaceChildren(...symbols.map(tile));
      this.strip.style.transform = "translateY(0)";
    }

    /**
     * Spin to `final` (array of visible symbols). `fillers` scroll past first.
     * `decelMs`: the reel runs at full speed and only slows down over this last stretch
     * (a teasing reel keeps rolling fast instead of crawling). Defaults to the whole spin.
     * Resolves when the reel has stopped and bounced.
     */
    spin(final, fillers, duration, decelMs) {
      this.el.classList.remove("larry-full");
      const list = [...final, ...fillers, ...this.symbols];
      this.strip.replaceChildren(...list.map(tile));
      const distance = (final.length + fillers.length) * cellH;
      this.start = performance.now();
      this.duration = duration;
      this.decelMs = decelMs;
      this.el.classList.add("blur");
      return new Promise((resolve) => {
        const frame = (now) => {
          const elapsed = now - this.start;
          const t = Math.min(1, elapsed / this.duration);
          // Constant speed, then a cubic slow-down over the last `d` ms that starts at that speed.
          const d = Math.min(this.duration, this.decelMs || this.duration);
          const cruise = this.duration - d;
          const decelShare = 1 / (1 + (3 * cruise) / d);
          let eased;
          if (t >= 1) eased = 1;
          else if (elapsed < cruise) eased = (elapsed / d) * 3 * decelShare;
          else eased = 1 - decelShare + decelShare * (1 - Math.pow(1 - (elapsed - cruise) / d, 3));
          let y = -distance + distance * eased;
          if (elapsed > this.duration - d * 0.18) this.el.classList.remove("blur");
          if (t >= 1) {
            const b = (now - this.start - this.duration) / BOUNCE_MS;
            if (b < 1) {
              y = BOUNCE_PX * Math.sin(Math.PI * b) * (1 - b);
            } else {
              this.show(final);
              resolve();
              return;
            }
          }
          this.strip.style.transform = `translateY(${y}px)`;
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
    }

    /** STOP pressed: land within the next `ms` milliseconds. */
    hurry(ms) {
      if (!this.start) return;
      const elapsed = performance.now() - this.start;
      if (elapsed < this.duration) {
        this.duration = Math.min(this.duration, elapsed + ms);
        this.decelMs = 0; // STOP: back to the plain slow-down
      }
    }
  }

  class ReelSet {
    constructor(reelsEl, cellsEl) {
      this.reels = rows.map((_, i) => new Reel(i, reelsEl));
      // One highlight box per visible position, for showing wins.
      this.cellsEl = cellsEl;
      this.cells = rows.map((n, r) =>
        Array.from({ length: n }, (_, k) => {
          const c = document.createElement("div");
          c.className = "cell";
          c.style.left = REEL_POS[r].x + "px";
          c.style.top = REEL_POS[r].y + k * cellH + "px";
          cellsEl.appendChild(c);
          return c;
        })
      );
    }

    show(grid) {
      grid.forEach((col, r) => this.reels[r].show(col));
    }

    /**
     * Animate a spin. `strips` and `stops` give the real strip so the symbols that
     * scroll past are the ones that are actually there.
     * opts: { baseMs, staggerMs, extraMs: [per-reel extra spin time], decelMs: [per reel, optional], onReelStop(r) }
     */
    async spin(grid, strips, stops, opts) {
      this.clearHighlights();
      this.stopping = false;
      const promises = this.reels.map((reel, r) => {
        const strip = strips[r];
        const extra = (opts.extraMs && opts.extraMs[r]) || 0;
        // Longer spins scroll more symbols, so the reel speed stays the same.
        const count = Math.round((FILLER + r * 3) * (1 + extra / (opts.baseMs + r * opts.staggerMs)));
        const fillers = [];
        for (let i = 0; i < count; i++) {
          fillers.push(strip[(stops[r] + rows[r] + i) % strip.length]);
        }
        const duration = opts.baseMs + r * opts.staggerMs + extra;
        const decel = opts.decelMs && opts.decelMs[r];
        return reel.spin(grid[r], fillers, duration, decel).then(() => opts.onReelStop && opts.onReelStop(r));
      });
      this.active = promises;
      await Promise.all(promises);
      this.active = null;
    }

    hurry() {
      this.reels.forEach((reel, i) => reel.hurry(120 + i * 60));
    }

    setLarryFull(r, on) {
      this.reels[r].el.classList.toggle("larry-full", on);
    }

    /** kind: "larry" (pink) or "wheel" (rainbow) */
    setAnticipation(r, on, kind = "larry") {
      this.reels[r].el.classList.toggle("anticipate", on);
      this.reels[r].el.classList.toggle("wheel-tease", on && kind === "wheel");
      this.cellsEl.classList.toggle("teasing", this.reels.some((x) => x.el.classList.contains("anticipate")));
    }

    /** A landed bonus symbol pulses while the next reels decide. */
    setGlow(r, k, on) {
      this.cells[r][k].classList.toggle("glow", on);
    }

    clearGlow() {
      this.cells.flat().forEach((c) => c.classList.remove("glow"));
      this.cellsEl.classList.remove("teasing");
    }

    clearLarry() {
      this.reels.forEach((reel) => reel.el.classList.remove("larry-full", "anticipate", "wheel-tease"));
      this.cellsEl.classList.remove("teasing");
    }

    /** cells: [[reel,row],...] to light up; everything else dims. */
    highlight(cells) {
      this.cellsEl.classList.add("showing");
      this.cells.flat().forEach((c) => c.classList.remove("hit"));
      cells.forEach(([r, k]) => this.cells[r][k].classList.add("hit"));
    }

    clearHighlights() {
      this.cellsEl.classList.remove("showing");
      this.cells.flat().forEach((c) => c.classList.remove("hit"));
    }
  }

  LM.ReelSet = ReelSet;
  LM.REEL_POS = REEL_POS;
})();
