# Lobstermania 3 – Home Remake Plan

A just-for-fun, play-money remake of **Lucky Larry's Lobstermania 3** (IGT) for personal use at home.
No real money, no purchases, no online accounts: the credits are pretend and reset whenever you want.

---

## 1. What the screenshots show

| Screenshot | What it tells us |
|---|---|
| `main screen.png` | 5 reels with **3‑4‑5‑4‑3** rows = **720 ways** (3×4×5×4×3). Wooden dock frame, ocean background. Banner: *"Filling reels 2, 3 and 4 initiates the Buoy Bonus"*. |
| `topscreen.png` | Paytable, wild rules, two progressive meters (**Mother Lode**, **Full Trap**), and the **Big Wheel Bonus** rule. |
| `bonusInitiated.png` | "BONUS INITIATED!" celebration with the lobster mascot. |
| `pickabonus.png` | Player chooses **Buoy Bonus Classic** or **Buoy Bonus Free Games**. |
| `pickalobster.png` | "Pick a Lobster!": 3 lobsters, each hides a prize (number of picks / multiplier). |
| `choose.png` | Buoy Bonus Classic: Lucky Larry on his boat *Lobster Magnet III*, 9 coloured buoys, "Picks Left" counter. |
| Symbol PNGs | `buoy`, `boat`, `lighthouse`, `anchor`, `starfish`, `pearl`, `fish` (tuna), `turtle`, `seagul`, `Lobstermania` (Larry bonus symbol). |

### Paytable (from `topscreen.png`), paid left-to-right on adjacent reels

| Symbol | 5 | 4 | 3 |
|---|---|---|---|
| Buoy | 60 | 30 | 15 |
| Boat | 50 | 25 | 15 |
| Lighthouse | 40 | 20 | 10 |
| Anchor | 25 | 15 | 10 |
| Starfish / Pearl / Tuna / Turtle / Seagull | 15 | 10 | – |

- **Wild** (Lobstermania 3 logo): substitutes for everything except the Larry symbol and the wheel symbol.
- **Larry symbol** (`Lobstermania.png`): appears on reels 2, 3 and 4 only. Fill all three reels completely and you get the **Buoy Bonus**.
- **Big Wheel symbol**: 3 on consecutive reels triggers the **Big Wheel Bonus**.
- **Progressives**: Mother Lode and Full Trap. In our version these are just fun play-credit jackpots that grow with each spin.

### Bonus rules found online
Rules are from [thebigpayback.com](https://thebigpayback.com/video/lucky-larrys-lobstermania-3/), with extra detail from [VegasSlotsOnline](https://www.vegasslotsonline.com/igt/lucky-larrys-lobstermania-3/) and [LCB](https://lcb.org/games/lucky-larrys-lobstermania-3).

- **Big Wheel Bonus**: a small multicoloured wheel icon sits in the corner of some normal symbols. 3, 4 or 5 of these on consecutive reels give **1, 2 or 3 wheel spins**. The wheel is a wooden ship's wheel with coloured segments (e.g. 1000, 2000, 2500, 5000, 6000), plus **BUOY BONUS**, **extra SPINS** and the progressives.
- **Buoy Bonus Classic**: pick a lobster to get **2, 3 or 4 buoy picks**. Each buoy pulls **2–4 items** from its trap, each worth **10–1000 credits** × bet multiplier.
- **Buoy Bonus Free Games**: pick a lobster to get **2, 3 or 4 buoy picks**, then play **8 free spins** on a dark underwater background with "Free Games Remaining / Played" counters. In free games, red lobster **WILD** tiles appear, plus "lobster trap" sub-symbols. 2+ traps on consecutive reels open a buoy pick, which awards credits, wilds on the next spin, **3× or 5× multipliers**, extra free games, or **King Stacks** (one symbol stacked over whole reels on the next spin).
- **Progressives**: the Mother Lode and Full Trap jackpots, won through the wheel.

### Seen in the gameplay video ([YouTube QP-XaDjwmh0](https://www.youtube.com/watch?v=QP-XaDjwmh0))
Screenshots are in `reference/video/`. The video is filmed from the real machine, so frames are slightly angled and the reflections are visible.

| Time | File | What it shows |
|---|---|---|
| 4:00 | `01_base_game_bigwheel_banner` | Base game, banner "3 or more ⚙ on adjacent reels initiates the Big Wheel Bonus" |
| 5:22 | `02_pick_a_lobster` | Pick a Lobster |
| 16:33 | `03_pick_a_lobster_reveal_buoy_picks` | Reveal: each lobster shows **"2 / 3 / 4 BUOY PICKS"**, and the chosen one lights up in colour |
| 5:28 | `04_buoy_picks_boat` | Boat with 9 buoys and "Picks Left". Picked buoys turn into ghost outlines |
| 5:52 | `05_free_games_rules_buoy_awards` | **Key rules screen** (see below) |
| 6:16 / 8:09 | `06`, `07` | Free games on an underwater background. **Treasure-chest "trap" symbols** sit on the reels |
| 6:20 / 6:33 | `08`, `09` | Top screen: Larry hauls up a buoy and holds up the lobster. Credit values (375, 200…) float next to the used buoys |
| 6:50 | `10_free_games_3x_multiplier` | Green "GAME MULTIPLIER 3×" splat |
| 12:15 | `11_free_games_king_stacks` | "ALL KING STACKS ARE NOW [turtle]": whole reels fill with one symbol |
| 13:15 | `12_total_bonus_screen` | "TOTAL BONUS 5800 CREDITS" end screen |
| 15:28 | `13_big_wheel_initiated` | "Big Wheel Bonus Initiated! 2 Spins Awarded" |
| 15:32 | `14_wheel_icons_on_symbols_larry_walk` | **Small ship-wheel icons** in the corner of symbols. Larry walks across the screen as a trigger animation |
| 15:40 | `15_big_wheel_segments` | The wheel on the top screen, with the Mother Lode / Full Trap meters above it |

**Free Games buoy awards** (from screen 05). In free games, 2 or more trap (chest) symbols on adjacent reels use up one buoy pick. The lobster that comes up decides the prize:
- 🔴 **Red lobster**: awards credits
- 🔵 **Blue lobster**: awards wilds on the next game
- ⚪ **Silver lobster**: awards a 3× or 5× multiplier for the next game's wins
- 🛟 **"8 extra" sign**: awards extra free games
- 👑 **Gold crown**: awards matching King Stacks on the next game

**Big Wheel segments seen** (only partly readable): credit amounts from about 1000 to 7000 (e.g. 2000, 2500, 3000), BUOY BONUS (appears twice) and MOTHER LODE PROGRESSIVE. A Full Trap segment is probably there too, but it isn't visible in the frames. The pointer is at the top.

**Not in the video:** the Classic Buoy Bonus trap reveal. The player chose Free Games every time.

### Official promo video: best artwork source
Oregon Lottery promo "VL LL3 bonus", 1080p ([Vimeo](https://vimeo.com/408171599/2c0175b259)). It's a clean screen recording, not filmed from a machine. **32 frames** are in `reference/promo/`; files marked `_HIRES` are zoomed halves with more detail.

New things it showed:
- **Larry symbol fill**: when reels 2–4 fill with the Larry symbol, a reel that's already full glows with a red/pink sparkle border while the others are still spinning (`02`).
- **Big Wheel Bonus symbol**: a separate tile that says "BIG WHEEL BONUS" (`24`). The small ship-wheel icon also sits in the corner of normal symbols.
- **Wheel spin**: Larry walks on, and a glowing mini ship-wheel says "TOUCH & DRAG ON THE SCREEN TO SPIN THE WHEEL", with a "SPIN 0 OF 1" counter (`27`). The big wheel on the top screen then spins to a pointer at the top (`26`, `28`).
- **Wheel segments seen**: 1000, 1250, 1500, 2500, 3000, 3500, 5000, 750 (some may be ×10), **BUOY BONUS** (about 3 slices), **FULL TRAP PROGRESSIVE** and **MOTHER LODE PROGRESSIVE**.
- **Classic Buoy Bonus** (`19`–`22`): pick buoys and Larry hauls up the trap. A credit value floats beside him (e.g. 175), and each used buoy becomes a glass outline showing its value (525, 675, 400…). **Big moment:** a GIANT lobster bursts out of the water in front of the boat, worth **4,000**.
- **Free Games top-screen surprises**: besides lobsters, Larry can haul up a **shark** (250) or a wooden trap crate, and **dolphins** jump around the boat (`16`–`18`). These are fun animations to copy.
- **King Stacks**: a "NEXT GAME: ALL KING STACKS" banner, then "ALL KING STACKS ARE NOW [boat]", where whole reels become that symbol (`14`, `15`).
- The base game can show whole reels of one symbol, e.g. a full screen of buoys (`23`).
- **Total Bonus** end screen (7590 credits).

---

## 2. Tech choice

**A web page (HTML + JavaScript) that runs in any browser.**
- Works on the PC, a laptop, an iPad or a phone. Your wife can play it from the couch.
- Nothing to install. Open `index.html`, or "Add to Home Screen" on a tablet so it feels like an app.
- Rendering: **PixiJS** (smooth 60fps reel spins, sprite animation, particles for coin showers). The alternative is plain Canvas/CSS, which is simpler but less flashy.
- Sound: **Howler.js** for spin clicks, reel stops, win jingles and bonus music.
- Saving: the credit balance, settings and stats are stored in the browser (localStorage).

Everything stays local in `D:\Lobstermania`. Because the artwork belongs to IGT, we **keep it private and don't publish it online**.

---

## 3. Project structure

```
D:\Lobstermania\
  index.html
  src/
    main.js          – boot, asset loading, scene switching
    config.js        – paytable, reel strips, bet levels (all tunable numbers)
    engine/
      rng.js         – random number generator
      reels.js       – reel strips, spin result, 720-ways evaluation
      payout.js      – win calculation, wild substitution
      progressive.js – Mother Lode / Full Trap meters
    scenes/
      BaseGame.js    – reels, spin button, bet, credits, win meter
      BonusIntro.js  – "Bonus Initiated!" splash
      PickBonus.js   – choose Classic vs Free Games
      PickLobster.js – pick 1 of 3 lobsters
      BuoyClassic.js – boat + 9 buoys pick game
      BuoyFreeGames.js
      BigWheel.js
      Paytable.js    – help/info screen (top screen)
    ui/              – buttons, meters, win popups, coin shower
  assets/
    symbols/         – your symbol PNGs (cleaned up)
    backgrounds/
    sounds/
  tools/
    simulate.js      – runs millions of spins to check the payout balance
```

---

## 4. Build phases

### Progress
- **2026-10-17: Phase 1 done.** To play, double-click `index.html` (Chrome or Edge).
  - Real artwork cut from the promo frames by `tools/extract_assets.py`.
  - 720-ways maths in `js/engine.js` and spinning reels with STOP in `js/reels.js`.
  - Game flow, Settings and saving in `js/game.js`.
  - Pink glow when Larry fills a reel, and a longer reel-4 spin when two Larry reels are full.
  - The Buoy Bonus trigger works but currently pays a placeholder prize (40× bet) until Phase 2.
  - `tools/sim.html` shows the base-game payout of each generosity level.

- **2026-10-17: Phase 2a done, Buoy Bonus Classic.**
  - The flow: Pick a Bonus, then Pick a Lobster (2/3/4 buoy picks), then the boat with 9 buoys. Larry hauls the crate and pulls out lobsters (12 fps flipbook cut from the promo), and sometimes a giant lobster bursts out of the water. It ends on the Total Bonus board.
  - Art comes from `tools/extract_bonus.py`. Prizes are in `LM.BONUS` in `js/config.js`.
  - Free Games shows "Coming soon" for now.
  - Each generosity level has a measured total payback (base game plus bonus): 1 is about 86%, 2 about 90%, 3 about 93%, 4 about 105%, 5 about 122%.
  - The single-file build is `dist/lobstermania.html` (about 11 MB, because Larry's animation frames are embedded). Rebuild it with `python tools/build_single.py`.

- **2026-10-17: Phase 2b done, Buoy Bonus Free Games.** Pick buoys, then the rules board, then 8 free games on underwater reels.
  - Treasure chests land on symbols. 2+ chests on adjacent reels give "LOOK UP!", and Larry (on the top screen) hauls *every* picked buoy for an award:
    - credits
    - wilds on the next game
    - a 3×/5× multiplier on the next game
    - +3 free games
    - matching King Stacks on the next game (the first 2 reels fill with one symbol)
  - Next-game awards that land on the last game add 1 bonus game. If no buoys activate at all, Larry hauls them at the end for credits.
  - Maths are in `LM.engine.playFreeGames` and tuning is in `LM.FREE_GAMES` (`js/config.js`). Free Games averages about 43× bet, Classic about 36×.
  - Art comes from `tools/extract_freegames.py`. The underwater reel background is rebuilt from water-coloured pixels across ~50 frames.
  - Each level's measured total payback (base + bonus): 1 is about 84%, 2 about 92%, 3 about 97%, 4 about 111%, 5 about 118%.
  - Settings has a test mode with a TEST BONUS button (or the B key).

- **2026-10-17: Sound.** All sounds are synthesized live with the Web Audio API in `js/sound.js`, with no sound files:
  - reel spin ticking and reel-stop thunks, the Larry sparkle and the tease riser
  - win count-up ticks, a big-win fanfare with a coin shower, and the "Bonus Initiated" fanfare
  - pick, splash and winch sounds, prize dings, the giant-lobster boom, chest knocks, the LOOK UP foghorn and the Total Bonus fanfare
  - a looping sea-shanty tune during bonuses
  - Controls: the speaker button on the bar (or the M key), plus Settings for effects on/off, music on/off and volume.
  - The promo video's audio wasn't usable because it's music plus voice-over. Real recordings could replace individual sounds later.

- **2026-10-17: Phase 3 done, Big Wheel Bonus and progressives.**
  - The **Big Wheel Bonus** symbol (its own tile, as in the promo) sits on every reel. 3, 4 or 5 on adjacent reels give 1, 2 or 3 wheel spins. Wild doesn't stand in for it.
  - The flow: "Big Wheel Bonus Initiated! N spins awarded" board (cut from the promo by `tools/extract_wheel.py`). Then the big ship's wheel fills the top screen with the Mother Lode / Full Trap meters. The bottom screen shows a glowing mini wheel with "Touch & drag on the screen to spin the wheel" and a SPIN x OF n counter. Drag, click or press space to spin, and "LOOK UP!" shows while it turns.
  - The wheel is drawn in `js/wheel.js`, because the promo never shows all of it. Its 16 slices follow the promo's order and colours: credits (750 to 5000 at max bet), 4 × BUOY BONUS, MOTHER LODE and FULL TRAP. Prizes and weights are in `LM.WHEEL` (`js/config.js`).
  - A BUOY BONUS slice plays a normal Buoy Bonus (Classic or Free Games) after the wheel spins.
  - **Progressives** pay the whole meter at max bet and a share at lower bets (bet multiplier 2 wins 2/5), then reset to the seed ($250 / $50).
  - The wheel averages about 8× bet, plus any Buoy Bonus it lands on. Adding the wheel symbols lowered the base game, so each level's strips were re-picked (new seeds). Measured total payback over 1M spins: 1 is about 84%, 2 about 92%, 3 about 95%, 4 about 109%, 5 about 122%. The Big Wheel comes about every 140 (level 1) to 300 (level 5) spins.
  - Test mode has a TEST WHEEL button (or the W key) next to TEST BONUS. The stats now count Big Wheel bonuses and progressives won.

- **2026-10-17: Phase 4, polish and excitement.**
  - **Bonus anticipation:** a reel that could still finish a bonus rolls longer at full speed. It glows (pink for Larry, rainbow for the Big Wheel), and the message line shouts "BUOY BONUS CHANCE!" / "BIG WHEEL BONUS CHANCE!".
    - Larry filling reel 2 makes reel 3 tease. Reels 2 and 3 full make reel 4 tease, longer.
    - Big Wheel symbols on 2+ reels in a row make the next reel tease, going for more spins.
    - Tension music builds with each level (faster pulse, drums, higher figure). It ends in a big hit, or a falling "aww" on a miss.
    - Landed Big Wheel symbols pulse and ring higher one after another.
    - Settings live in `anticipation()` in `js/game.js`.
  - Normal spins roll a little longer than before (about 1.8 s instead of 1.6 s).
  - **Music:** the bonus shanty now has drums, squeezebox chords and a key change on every second time round. Music is louder by default and has its own volume slider in Settings.
  - **Big wins:** the title grows during the count-up (BIG, then HUGE, then MEGA WIN), each step with a fanfare and a bigger shower of spinning gold coins (`js/fx.js`). Coins also rain on Total Bonus boards and progressive wins.
  - **Autoplay** (Settings, or the A key): 10–250 spins, optionally stopping after a bonus. PLAY or space stops it.
    - Bonuses play themselves during autoplay. `LM.Bonus.autoClick` makes a random pick after a short pause on every pick screen: Pick a Bonus, Pick a Lobster, buoys, the rules board and the wheel spin. Stopping autoplay mid-bonus hands the remaining picks back.
  - **Full screen:** Settings or the F key.

### Phase 1: Playable base game (the core loop)
1. Clean up and crop the symbol images (consistent size, transparent or rope-framed tiles).
2. Lay out a 5-reel 3‑4‑5‑4‑3 grid on the dock/ocean background.
3. Spinning reels: blur, staggered stops, a little bounce.
4. 720-ways win evaluation with wilds, plus highlighting of the winning symbols.
5. HUD: Credits, Bet (−/+), Win, SPIN button and spacebar. Start with e.g. 1,000 play credits and a "Refill credits" button.

✅ *Milestone: she can sit down and spin.*

### Phase 2: Buoy Bonus (the fan favourite)
1. Larry symbol stacks on reels 2–4, with the "fill reels" trigger and red glow on filled reels (as in the screenshot).
2. "Bonus Initiated!" splash.
3. Pick a Bonus: Classic or Free Games.
4. Pick a Lobster: reveals the number of buoy picks.
5. **Buoy Classic**: boat scene with 9 buoys. Each pick hauls up a trap with lobsters worth X credits (plus the occasional Golden Lobster jackpot). Track "Picks Left".
6. **Buoy Free Games**: free spins with buoy-themed extra wilds or multipliers.

✅ *Milestone: the full bonus experience works.*

### Phase 3: Big Wheel Bonus and Progressives ✅
1. Big Wheel symbol and trigger on 3 consecutive reels.
2. Spinning prize wheel with segments for credits, Mother Lode and Full Trap.
3. Progressive meters that tick up a little with every bet.

### Phase 4: Polish (mostly done, see Progress)
- Sounds and music (reel stops, the "rollup" counting sound, bonus tune).
- Win celebrations scaled by size (small win → nice win → BIG WIN coin shower).
- Paytable/help screen (recreating `topscreen.png`).
- Autoplay, turbo spin and a mute button.
- Fun stats: biggest win, number of bonuses, lifetime spins.
- Fullscreen and tablet-friendly touch controls.

### Phase 5: Balance tuning
- Write the reel strips (which symbols, and how often each appears on each reel).
- Run `tools/simulate.js` over ~10 million spins to measure return %, bonus frequency and hit rate.
- Target what *feels* like the casino: ~94–96% return, a bonus roughly every 100–150 spins, and frequent small wins. Since it's play money, we can make it more generous if she prefers.

---

## 5. Assets: what we have and what's missing

**Have:** 10 base symbols, plus reference screens for the main game, top screen, bonus intro, pick screens and the buoy game.

**Found online** (reference images, not yet downloaded):
- Free Games screen: [LCB ss1](https://a1.lcb.org/system/modules/game/images/attachments/000/023/492/original/ss1.jpg), showing the underwater background, WILD lobster tile and counters.
- Big Wheel: [onlineslots gallery-4](https://services.onlineslots.com/cms-assets/gallerys/en-5x-magic/_850x637_crop_center-center_82_line/lucky-larrys-lobstermania-3-gallery-4.jpg), showing the ship's wheel and its segments.
- Wild "Lobstermania 3" tile in the base game (small): [LCB ss4](https://a1.lcb.org/system/modules/game/images/attachments/000/023/515/original/ss4.jpg).
- Buoy pick screen at a different moment: [LCB ss3](https://a1.lcb.org/system/modules/game/images/attachments/000/023/511/original/ss3.jpg).
- Full gameplay video with every feature: [YouTube](https://www.youtube.com/watch?v=01Z_VIeEZLQ). Good for grabbing more screenshots and checking the animations.

**Captured from the video:** 15 frames in `reference/video/` (see section 1).

**Captured from the official promo:** 32 clean frames in `reference/promo/` (see section 1). They cover the Classic bonus, the Big Wheel, the wild tile and the wheel icon.

**Still needed** (otherwise I'll draw stand-ins):
- Sounds and music
- A clean background without reels
- Sounds: free sound effects, or recorded from the video

Screenshots are low-res (cropped from video), so symbols may look soft at full screen. We can upscale them or redraw them as vector art.

---

## 6. Decisions (answered 2026-10-17)

1. **Device: PC.** Widescreen layout, mouse and spacebar. The real machine stacks its top and bottom screens, so we show them stacked in the middle with the ocean art on the sides, just like the promo video.
2. **Look: as faithful as possible.** Use the real artwork cut from the 1080p promo frames (`reference/frames/`).
3. **Priority: the Buoy Bonus**, right after the base game.
4. **Sound: later.**
5. **Generosity: adjustable on a Settings page.** It includes a live estimate of the payout % and how often the bonus comes.

**Tech note:** this PC has no Node.js, so the game is plain HTML/CSS/JavaScript with no build step. It runs by double-clicking `index.html` and works offline.
