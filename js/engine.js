/* Game maths: reel strips, spin results and 720-ways win evaluation.
   No DOM code here, so the same functions drive the game and the payout simulator. */
(function () {
  const { rows } = LM.CONFIG;

  // Small seedable RNG (mulberry32) so a given generosity level always builds the same strips.
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rand) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Build the five reel strips for a generosity level. */
  function buildStrips(level) {
    const w = LM.STRIP_WEIGHTS[level];
    const rand = seeded(LM.LEVEL_RECIPES[level].seed || 1000 + level);
    const strips = [];
    for (let r = 0; r < 5; r++) {
      // Symbols come in blocks ("King Stacks"): each block is 1..maxStack of the same symbol.
      const blocks = [];
      for (const sym of [...LM.PAY_SYMBOLS, "wild"]) {
        const maxStack = sym === "wild" ? 1 : w.stack[sym] || w.stack.low;
        for (let n = 0; n < w[sym][r]; n++) {
          blocks.push({ sym, len: 1 + Math.floor(rand() * maxStack) });
        }
      }
      shuffle(blocks, rand);
      // Avoid two blocks of the same symbol touching so stacks keep their intended size.
      for (let i = 1; i < blocks.length; i++) {
        if (blocks[i].sym === blocks[i - 1].sym) {
          const j = (i + 2 + Math.floor(rand() * (blocks.length - 3))) % blocks.length;
          [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        }
      }
      // Drop stacks of Larry in at evenly spaced spots (reels 2-4 only).
      const stacks = w.larryStacks[r];
      const strip = [];
      const gap = stacks ? Math.floor(blocks.length / stacks) : Infinity;
      blocks.forEach((b, i) => {
        if (stacks && i % gap === 0 && i / gap < stacks) {
          for (let n = 0; n < rows[r] + w.larryExtra; n++) strip.push("larry");
        }
        for (let n = 0; n < b.len; n++) strip.push(b.sym);
      });
      // Big Wheel symbols go in between blocks, chosen with their own RNG so the rest of the
      // strip (and the payout each level was tuned to) stays the same.
      const wrand = seeded(9000 + level * 10 + r);
      for (let n = 0; n < w.wheels; n++) {
        const at = Math.floor(((n + wrand()) / w.wheels) * strip.length);
        let i = at;
        while (strip[i] === strip[(i - 1 + strip.length) % strip.length] || strip[i] === "larry" || strip[i - 1] === "larry") {
          i = (i + 1) % strip.length;
          if (i === at) break;
        }
        strip.splice(i, 0, "bigwheel");
      }
      strips.push(strip);
    }
    return strips;
  }

  /** Pick a random stop on each reel and return the visible grid: grid[reel][row]. */
  function spin(strips, rand = Math.random) {
    const stops = [];
    const grid = strips.map((strip, r) => {
      const stop = Math.floor(rand() * strip.length);
      stops.push(stop);
      const col = [];
      for (let k = 0; k < rows[r]; k++) col.push(strip[(stop + k) % strip.length]);
      return col;
    });
    return { grid, stops };
  }

  /**
   * 720 ways: for each paying symbol, count matching (or wild) positions on each reel,
   * from reel 1 rightwards. ways = product of the counts.
   * Returns { total, wins: [{ sym, length, ways, pay, cells: [[reel,row],...] }] } in credits.
   */
  function evaluate(grid, multiplier) {
    const wins = [];
    let total = 0;
    for (const sym of LM.PAY_SYMBOLS) {
      const pays = LM.SYMBOLS[sym].pays;
      let ways = 1;
      let length = 0;
      const cells = [];
      for (let r = 0; r < 5; r++) {
        let count = 0;
        grid[r].forEach((s, row) => {
          if (s === sym || s === "wild") {
            count++;
            cells.push([r, row]);
          }
        });
        if (!count) break;
        ways *= count;
        length++;
      }
      // Only reels that are part of the win stay highlighted.
      const used = cells.filter(([r]) => r < length);
      // A combination made only of wilds doesn't pay (wild has no pays of its own).
      const hasReal = used.some(([r, row]) => grid[r][row] === sym);
      if (pays[length] && hasReal) {
        const pay = pays[length] * ways * multiplier;
        total += pay;
        wins.push({ sym, length, ways, pay, cells: used });
      }
    }
    wins.sort((a, b) => b.pay - a.pay);
    return { total, wins };
  }

  /** Buoy Bonus: every position on reels 2, 3 and 4 shows Lucky Larry. */
  function isBuoyBonus(grid) {
    return [1, 2, 3].every((r) => grid[r].every((s) => s === "larry"));
  }

  /** How many of reels 2-4 are completely filled with Larry (for the anticipation glow). */
  function larryFullReels(grid) {
    return [1, 2, 3].filter((r) => grid[r].every((s) => s === "larry"));
  }

  /**
   * Big Wheel Bonus: the longest run of adjacent reels that each show a Big Wheel symbol.
   * Returns { spins, cells } (spins 0 when there is no run of 3 or more).
   */
  function bigWheel(grid) {
    let best = [];
    let run = [];
    for (let r = 0; r < 5; r++) {
      if (grid[r].includes("bigwheel")) run.push(r);
      else run = [];
      if (run.length > best.length) best = run.slice();
    }
    const spins = LM.WHEEL.spinsFor[best.length] || 0;
    const cells = [];
    if (spins) best.forEach((r) => grid[r].forEach((s, k) => s === "bigwheel" && cells.push([r, k])));
    return { spins, cells };
  }

  /** Pick the slice the wheel stops on (index into LM.WHEEL.slices). */
  function rollWheel(rand = Math.random) {
    const slices = LM.WHEEL.slices;
    let x = rand() * slices.reduce((s, sl) => s + sl.weight, 0);
    for (let i = 0; i < slices.length; i++) if ((x -= slices[i].weight) < 0) return i;
    return slices.length - 1;
  }

  /**
   * Roll the prizes for a Classic Buoy Bonus (credits at bet multiplier 1).
   * Returns { picks, buoys: [{ items: [credits...], giant: credits|0 }] }.
   * Picks are rolled for all three lobsters, so the reveal can show the other two.
   */
  function rollClassic(level, rand = Math.random) {
    const B = LM.BONUS;
    const scale = B.prizeScale[level] || 1;
    const lobsters = [0, 1, 2].map(() => LM.weighted(B.buoyPicks, rand));
    const buoys = [];
    for (let p = 0; p < 4; p++) {
      const n = LM.weighted(B.itemsPerBuoy, rand);
      const items = [];
      for (let k = 0; k < n; k++) items.push(Math.round(LM.weighted(B.itemValues, rand) * scale));
      const giant = rand() < B.giantChance ? Math.round(B.giantValue * scale) : 0;
      buoys.push({ items, giant });
    }
    return { lobsters, buoys };
  }

  function classicTotal(roll, picks) {
    return roll.buoys.slice(0, picks).reduce((s, b) => s + b.items.reduce((a, v) => a + v, 0) + b.giant, 0);
  }

  /**
   * Play out a whole Free Games bonus in advance (credits at bet multiplier 1).
   * The screen then just replays this script. Each time 2+ chests land on adjacent reels,
   * every picked buoy gives one award. Awards for "the next game" apply to the next spin;
   * if they land on the last spin, one extra game is added so they can be used.
   * If no buoys were activated at all, Larry hauls them at the end for credits.
   */
  function playFreeGames(level, picks, baseStrips, rand = Math.random) {
    const F = LM.FREE_GAMES;
    const scale = LM.BONUS.prizeScale[level] || 1;
    const strips = baseStrips.map((s) => s.filter((sym) => sym !== "larry" && sym !== "bigwheel"));
    const credit = () => {
      let v = 0;
      for (let n = LM.weighted(F.creditItems, rand); n > 0; n--) v += Math.round(LM.weighted(LM.BONUS.itemValues, rand) * scale);
      return v;
    };
    const rollAward = () => {
      const type = pickKey(F.awards, rand);
      if (type === "credits") return { type, credits: credit() };
      if (type === "wilds") return { type, count: LM.weighted(F.wildsCount, rand) };
      if (type === "multiplier") return { type, mult: LM.weighted(F.multiplier, rand) };
      if (type === "extra") return { type, games: F.extraGames };
      return { type: "king", sym: pickKey(F.kingSymbols, rand), reels: LM.weighted(F.kingReels, rand) };
    };

    const spins = [];
    let left = F.spins;
    let pending = {};
    let total = 0;
    let activations = 0;
    while (left > 0) {
      left--;
      const { grid, stops } = spin(strips, rand);
      const applied = { ...pending };
      if (applied.king) {
        for (let r = 0; r < applied.king.reels; r++) grid[r] = grid[r].map(() => applied.king.sym);
      }
      if (applied.wilds) {
        const cells = [];
        for (let r = 1; r < 5; r++) grid[r].forEach((_, k) => cells.push([r, k]));
        shuffle(cells, rand);
        applied.wildCells = cells.slice(0, applied.wilds);
        applied.wildCells.forEach(([r, k]) => (grid[r][k] = "wild"));
      }
      const result = evaluate(grid, 1);
      const mult = applied.mult || 1;
      const win = result.total * mult;
      pending = {};

      const chests = [];
      grid.forEach((col, r) => col.forEach((_, k) => rand() < F.chestChance && chests.push([r, k])));
      const reelsWith = new Set(chests.map(([r]) => r));
      const activated = [0, 1, 2, 3].some((r) => reelsWith.has(r) && reelsWith.has(r + 1));
      const awards = [];
      let awardCredits = 0;
      if (activated) {
        activations++;
        for (let i = 0; i < picks; i++) {
          const a = rollAward();
          awards.push(a);
          if (a.type === "credits") awardCredits += a.credits;
          else if (a.type === "wilds") pending.wilds = (pending.wilds || 0) + a.count;
          else if (a.type === "multiplier") pending.mult = Math.max(pending.mult || 1, a.mult);
          else if (a.type === "extra") left += a.games;
          else if (a.type === "king" && !pending.king) pending.king = { sym: a.sym, reels: a.reels };
        }
        if (left === 0 && Object.keys(pending).length) {
          left = 1;
          awards.bonusGame = true;
        }
      }
      total += win + awardCredits;
      spins.push({ grid, stops, wins: result.wins, mult, win, applied, chests, activated, awards, awardCredits, left });
    }
    const endAwards = [];
    if (!activations) {
      for (let i = 0; i < picks; i++) endAwards.push(credit());
      total += endAwards.reduce((a, v) => a + v, 0);
    }
    return { strips, spins, endAwards, total };
  }

  function pickKey(table, rand) {
    const entries = Object.entries(table);
    let x = rand() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of entries) if ((x -= w) < 0) return k;
    return entries[entries.length - 1][0];
  }

  /** Run n spins (base game, Buoy Bonus half Classic / half Free Games, Big Wheel) and report the payout. */
  function simulate(level, n, seed = 7) {
    const strips = buildStrips(level);
    const rand = seeded(seed);
    let paid = 0;
    let hits = 0;
    let bonuses = 0;
    let bonusPaid = 0;
    let classicPaid = 0;
    let freePaid = 0;
    let classicN = 0;
    let freeN = 0;
    let wheels = 0;
    let wheelPaid = 0;
    const P = LM.CONFIG.progressives;
    const buoyBonus = () => {
      bonuses++;
      const roll = rollClassic(level, rand);
      let v;
      if (bonuses % 2) {
        v = classicTotal(roll, roll.lobsters[0]);
        classicPaid += v;
        classicN++;
      } else {
        v = playFreeGames(level, roll.lobsters[0], strips, rand).total;
        freePaid += v;
        freeN++;
      }
      bonusPaid += v;
    };
    for (let i = 0; i < n; i++) {
      const { grid } = spin(strips, rand);
      const { total } = evaluate(grid, 1);
      paid += total;
      if (total > 0) hits++;
      if (isBuoyBonus(grid)) buoyBonus();
      const wheel = bigWheel(grid);
      if (wheel.spins) {
        wheels++;
        let v = 0;
        for (let k = 0; k < wheel.spins; k++) {
          const sl = LM.WHEEL.slices[rollWheel(rand)];
          // progressives: roughly where the meter sits on average, at multiplier 1 of 5
          if (sl.type === "credits") v += sl.value;
          else if (sl.type === "mother") v += (P.motherLode.seed * 1.3) / 5;
          else if (sl.type === "trap") v += (P.fullTrap.seed * 1.3) / 5;
          else buoyBonus(); // counted under bonusPaid
        }
        wheelPaid += v;
      }
    }
    const bet = LM.CONFIG.baseBet;
    return {
      spins: n,
      baseReturn: paid / (n * bet),
      bonusReturn: bonusPaid / (n * bet),
      wheelReturn: wheelPaid / (n * bet),
      totalReturn: (paid + bonusPaid + wheelPaid) / (n * bet),
      avgWheel: wheels ? wheelPaid / wheels / bet : 0,
      wheelEvery: wheels ? n / wheels : Infinity,
      avgBonus: bonuses ? bonusPaid / bonuses / bet : 0,
      avgClassic: classicN ? classicPaid / classicN / bet : 0,
      avgFree: freeN ? freePaid / freeN / bet : 0,
      hitRate: hits / n,
      bonusEvery: bonuses ? n / bonuses : Infinity,
    };
  }

  LM.engine = { seeded, buildStrips, spin, evaluate, isBuoyBonus, larryFullReels, bigWheel, rollWheel, rollClassic, classicTotal, playFreeGames, simulate };
})();
