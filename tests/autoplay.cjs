const { chromium } = require("playwright");
const assert = require("node:assert/strict");
// Start a local server with python3 -m http.server 8765 before running.
// Timers and animations are accelerated; outcomes are forced to cover each bonus path.
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox"],
  });
  for (const kind of [
    "classic",
    "free",
    "wheel",
    "wheel-buoy",
    "resume",
    "manual",
    "cancel",
  ]) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(
      ({ kind }) => {
        localStorage.setItem(
          "lobstermania3.save",
          JSON.stringify({
            credits: 100000,
            turbo: true,
            sound: { on: false },
            auto: {
              spins: kind === "resume" ? 2 : 1,
              stopAfterBonus: kind !== "resume",
            },
          }),
        );
        const interval = window.setInterval;
        window.setInterval = (fn, ms, ...a) =>
          interval(fn, Math.min(ms, 20), ...a);
        const timeout = window.setTimeout;
        window.rulesFallbackFired = 0;
        window.setTimeout = (fn, ms, ...a) => {
          if (ms === 12000)
            return timeout(() => {
              window.rulesFallbackFired++;
              fn(...a);
            }, 200);
          return timeout(fn, Math.min(ms, 20), ...a);
        };
        const now = performance.now.bind(performance);
        performance.now = () => now() * 100;
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (fn) => raf(() => fn(performance.now()));
      },
      { kind },
    );
    await page.goto("http://localhost:8765");
    await page.waitForFunction(() => window.LM?.Bonus);
    await page.evaluate((kind) => {
      window.testKind = kind;
      window.calls = { bonus: 0, wheel: 0, free: 0, picks: [] };
      const run = LM.Bonus.run;
      LM.Bonus.run = async (ctx) => {
        calls.bonus++;
        return run(ctx);
      };
      const free = LM.freeGames;
      LM.freeGames = async (...args) => {
        calls.free++;
        return free(...args);
      };
      const wheel = LM.BigWheel.run;
      LM.BigWheel.run = async (ctx) => {
        calls.wheel++;
        return wheel(ctx);
      };
      LM.engine.isBuoyBonus = () => !kind.startsWith("wheel");
      LM.engine.bigWheel = () => ({
        spins: kind.startsWith("wheel") ? 2 : 0,
        cells: [],
      });
      LM.engine.rollWheel = () =>
        LM.WHEEL.slices.findIndex(
          (s) => s.type === (kind === "wheel-buoy" ? "buoy" : "credits"),
        );
      LM.engine.rollClassic = () => ({
        lobsters: [2, 2, 2],
        buoys: [
          { items: [10], giant: 0 },
          { items: [20], giant: 0 },
        ],
      });
      Math.random = () => (kind === "free" ? 0.99 : 0);
      const choose = LM.Bonus.BoatScene.prototype.choose;
      LM.Bonus.BoatScene.prototype.choose = async function (ctx) {
        const i = await choose.call(this, ctx);
        if (this.buoys[i].picked) throw Error("duplicate buoy");
        calls.picks.push(i);
        return i;
      };
    }, kind);
    if (kind === "manual") {
      await page.keyboard.press("Space");
      await page.waitForSelector(".pick-circle");
      await page.waitForTimeout(200);
      assert.equal(await page.locator(".pick-circle").count(), 2);
    } else if (kind === "cancel") {
      // Stop while the initial reels are spinning, before bonus choices appear.
      await page.keyboard.press("a");
      await page.keyboard.press("a");
      await page.waitForSelector(".pick-circle");
      await page.waitForTimeout(200);
      assert.equal(await page.locator(".pick-circle").count(), 2);
    } else {
      await page.keyboard.press("a");
      await page.waitForFunction(
        () => {
          const s = JSON.parse(localStorage.getItem("lobstermania3.save"));
          return (
            s?.stats?.spins === (window.testKind === "resume" ? 2 : 1) &&
            s?.stats?.bonuses + s?.stats?.wheels > 0 &&
            document.querySelector("#btn-spin").textContent === "PLAY" &&
            !document.querySelector("#bonus-layer").children.length
          );
        },
        {},
        { timeout: 60000 },
      );
      const result = await page.evaluate(() => ({
        calls,
        stats: JSON.parse(localStorage.getItem("lobstermania3.save")).stats,
      }));
      assert.equal(result.stats.spins, kind === "resume" ? 2 : 1);
      assert.equal(result.calls.free, kind === "free" ? 1 : 0);
      assert.ok(result.calls.bonus + result.calls.wheel > 0);
    }
    if (kind === "free") {
      await page.waitForTimeout(250);
      assert.equal(
        await page.evaluate(() => window.rulesFallbackFired),
        0,
        "automatically dismissing rules must cancel the fallback timer",
      );
    }
    assert.deepEqual(errors, []);
    console.log("PASS", kind);
    await page.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
