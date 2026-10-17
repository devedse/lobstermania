/* Lobstermania 3 home remake: game rules and tunable numbers.
   Plain script (no modules) so the game runs by double-clicking index.html. */
window.LM = window.LM || {};

// Resolve an asset path. The single-file build (tools/build_single.py) fills LM_ASSETS
// with embedded copies; otherwise the path is used as-is.
LM.url = (path) => (window.LM_ASSETS && window.LM_ASSETS[path]) || path;

LM.CONFIG = {
  // 5 reels with 3-4-5-4-3 rows = 720 ways
  rows: [3, 4, 5, 4, 3],
  cellW: 158,
  cellH: 87,

  // Machine plays 50 credits x bet multiplier, 1 credit = 1 cent
  baseBet: 50,
  multipliers: [1, 2, 3, 4, 5],
  centsPerCredit: 1,

  startingCredits: 10000, // $100.00

  // Progressive meters (play money): seed values and how much of each bet feeds them
  progressives: {
    motherLode: { seed: 25000, rate: 0.006 },
    fullTrap: { seed: 5000, rate: 0.002 },
  },
};

// Paytable from the machine's top screen, paid per way x bet multiplier.
// Low symbols pay only for 4 or 5 of a kind.
LM.SYMBOLS = {
  buoy:   { name: "Buoy",       img: "assets/symbols/buoy.png",   pays: { 3: 15, 4: 30, 5: 60 } },
  boat:   { name: "Boat",       img: "assets/symbols/boat.png",   pays: { 3: 15, 4: 25, 5: 50 } },
  light:  { name: "Lighthouse", img: "assets/symbols/light.png",  pays: { 3: 10, 4: 20, 5: 40 } },
  anchor: { name: "Anchor",     img: "assets/symbols/anchor.png", pays: { 3: 10, 4: 15, 5: 25 } },
  star:   { name: "Starfish",   img: "assets/symbols/star.png",   pays: { 4: 10, 5: 15 } },
  pearl:  { name: "Pearl",      img: "assets/symbols/pearl.png",  pays: { 4: 10, 5: 15 } },
  tuna:   { name: "Tuna",       img: "assets/symbols/tuna.png",   pays: { 4: 10, 5: 15 } },
  turtle: { name: "Turtle",     img: "assets/symbols/turtle.png", pays: { 4: 10, 5: 15 } },
  gull:   { name: "Seagull",    img: "assets/symbols/gull.png",   pays: { 4: 10, 5: 15 } },
  // Wild substitutes for everything except Larry and the Big Wheel symbol
  wild:   { name: "Wild",       img: "assets/symbols/wild.png",   wild: true },
  // Lucky Larry: reels 2, 3 and 4 only. Filling all three reels starts the Buoy Bonus.
  larry:  { name: "Lucky Larry", img: "assets/symbols/larry.png", scatter: true },
  // Big Wheel Bonus: 3, 4 or 5 on adjacent reels give 1, 2 or 3 spins of the Big Wheel.
  bigwheel: { name: "Big Wheel Bonus", img: "assets/symbols/bigwheel.png", scatter: true },
};

LM.PAY_SYMBOLS = ["buoy", "boat", "light", "anchor", "star", "pearl", "tuna", "turtle", "gull"];

/* Generosity levels for the Settings page.
   Each level sets how many of each symbol sit on every reel strip, how many wilds
   there are, and how many (and how long) the stacks of Lucky Larry are on reels 2-4.
   The Settings page measures the real payout of each level by simulation. */
LM.GENEROSITY = {
  1: { label: "Casino tight" },
  2: { label: "Casino" },
  3: { label: "Friendly" },
  4: { label: "Generous" },
  5: { label: "Party time" },
};

/* Reel strip recipe per level (tuned with tools/sim.html):
   high/low   = how many blocks of each high / low symbol per reel
   highStack / lowStack = blocks are 1..N of the same symbol ("King Stacks")
   wilds      = wild blocks on reels 2-5
   larryStacks / larryExtra = stacks of Lucky Larry on reels 2-4, each (rows + extra) tall
   wheels     = single Big Wheel Bonus symbols on every reel
   seed       = which shuffle of the strips; picked by search so each level lands near its target payout
   Measured total payback (base + Buoy Bonus + Big Wheel, 1M spins): 1 ~84%, 2 ~92%, 3 ~95%, 4 ~109%, 5 ~122% */
LM.LEVEL_RECIPES = {
  1: { high: 2, low: 2, highStack: 6, lowStack: 5, wilds: 8,  larryStacks: 3, larryExtra: 4, seed: 42, wheels: 3 },
  2: { high: 2, low: 2, highStack: 6, lowStack: 5, wilds: 9,  larryStacks: 3, larryExtra: 4, seed: 68, wheels: 3 },
  3: { high: 2, low: 2, highStack: 6, lowStack: 5, wilds: 9,  larryStacks: 4, larryExtra: 4, seed: 64, wheels: 3 },
  4: { high: 2, low: 2, highStack: 7, lowStack: 5, wilds: 10, larryStacks: 4, larryExtra: 5, seed: 75, wheels: 3 },
  5: { high: 2, low: 2, highStack: 7, lowStack: 5, wilds: 10, larryStacks: 5, larryExtra: 6, seed: 19, wheels: 3 },
};

// Expand a recipe into per-reel symbol counts: [reel1, reel2, reel3, reel4, reel5]
LM.STRIP_WEIGHTS = {};
for (const [level, r] of Object.entries(LM.LEVEL_RECIPES)) {
  const w = {
    stack: { buoy: r.highStack, boat: r.highStack, light: r.highStack, anchor: r.highStack, low: r.lowStack },
    wild: [0, r.wilds, r.wilds, r.wilds, r.wilds],
    larryStacks: [0, r.larryStacks, r.larryStacks, r.larryStacks, 0],
    larryExtra: r.larryExtra,
    wheels: r.wheels || 0,
  };
  for (const s of ["buoy", "boat", "light", "anchor"]) w[s] = Array(5).fill(r.high);
  for (const s of ["star", "pearl", "tuna", "turtle", "gull"]) w[s] = Array(5).fill(r.low);
  LM.STRIP_WEIGHTS[level] = w;
}

/* ---------- Buoy Bonus ---------- */
LM.BONUS = {
  // Pick a Lobster: how many buoy picks each lobster can hide (and how likely)
  buoyPicks: { 2: 50, 3: 35, 4: 15 },

  // Classic: each picked buoy pulls 2-4 items from Larry's trap...
  itemsPerBuoy: { 2: 50, 3: 35, 4: 15 },
  // ...each worth this many credits (x bet multiplier). value: weight
  itemValues: {
    10: 6, 15: 6, 20: 6, 25: 8, 50: 12, 75: 12, 100: 12, 150: 10,
    200: 8, 250: 6, 300: 4, 400: 3, 500: 2.5, 750: 1, 1000: 0.5,
  },
  // Sometimes a GIANT lobster comes up with the trap (the promo shows 4,000 at bet x5)
  giantChance: 0.07,
  giantValue: 800,

  // Prize size per generosity level (1 = Casino tight ... 5 = Party time)
  prizeScale: { 1: 1.5, 2: 1.6, 3: 1.7, 4: 1.7, 5: 1.5 },
};

/** Weighted random pick from an object of { value: weight }. */
LM.weighted = function (table, rand = Math.random) {
  const entries = Object.entries(table);
  let r = rand() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of entries) {
    if ((r -= w) < 0) return Number(v);
  }
  return Number(entries[entries.length - 1][0]);
};

/* ---------- Buoy Bonus Free Games ---------- */
LM.FREE_GAMES = {
  spins: 8,
  // chance that a visible symbol carries a trap (treasure chest)
  chestChance: 0.055,
  // what each picked buoy awards when 2+ chests land on adjacent reels. type: weight
  awards: { credits: 40, wilds: 20, multiplier: 18, extra: 8, king: 14 },
  creditItems: { 1: 100 },             // how many lobster values a credits award adds up
  wildsCount: { 2: 30, 3: 40, 4: 30 },
  multiplier: { 3: 90, 5: 10 },
  extraGames: 3,
  kingReels: { 2: 100 },               // how many reels (from the left) fill with the King Stack symbol
  kingSymbols: { buoy: 4, boat: 6, light: 12, anchor: 20, star: 14, pearl: 14, tuna: 15, turtle: 15 },
  // Free-game symbol tiles (blue underwater versions)
  img: {
    buoy: "assets/freegames/buoy.png", boat: "assets/freegames/boat.png", light: "assets/freegames/light.png",
    anchor: "assets/freegames/anchor.png", star: "assets/freegames/star.png", pearl: "assets/freegames/pearl.png",
    tuna: "assets/freegames/tuna.png", turtle: "assets/freegames/turtle.png", gull: "assets/freegames/gull.png",
    wild: "assets/freegames/wild.png",
  },
};

/* ---------- Big Wheel Bonus ----------
   The wheel's 16 slices in clockwise order, as far as the promo shows them.
   Credit slices are in credits at bet multiplier 1; the wheel shows them x the bet multiplier
   (so 150 ... 1000 shows as 750 ... 5000 at max bet, like the machine).
   weight = how likely the pointer stops on that slice. */
LM.WHEEL = {
  spinsFor: { 3: 1, 4: 2, 5: 3 }, // Big Wheel symbols on adjacent reels -> spins
  slices: [
    { type: "mother", weight: 0.35 },
    { type: "credits", value: 150, weight: 14 },
    { type: "buoy", weight: 3.5 },
    { type: "credits", value: 300, weight: 12 },
    { type: "credits", value: 700, weight: 5 },
    { type: "credits", value: 1000, weight: 3 },
    { type: "buoy", weight: 3.5 },
    { type: "credits", value: 500, weight: 9 },
    { type: "trap", weight: 1.2 },
    { type: "credits", value: 200, weight: 14 },
    { type: "buoy", weight: 3.5 },
    { type: "credits", value: 250, weight: 12 },
    { type: "credits", value: 600, weight: 7 },
    { type: "credits", value: 500, weight: 9 },
    { type: "buoy", weight: 3.5 },
    { type: "credits", value: 400, weight: 10 },
  ],
  colors: ["#ff8a00", "#14c8e6", "#ffd21a", "#ff2f6d", "#1e7bff", "#a23bff", "#9be22c", "#ff3fae",
           "#ffe82a", "#ff2626", "#2f6bff", "#18d6a0", "#e93cff", "#3ad13a", "#ff9d1a", "#00b7ff"],
};
// Progressives (Mother Lode, Full Trap slices) pay the full meter at max bet and a share of it
// at lower bets: bet multiplier 2 wins 2/5 of the meter. The meter then resets to its seed.
