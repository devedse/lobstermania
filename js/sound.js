/* Sound effects and bonus music, synthesized with the Web Audio API (no sound files).
   LM.sound.play("reelStop") etc. Browsers only allow audio after the first click or key
   press, so the audio context is created/resumed on the first user gesture. */
(function () {
  let ctx = null;
  let master, sfxGain, musicGain;
  const settings = { on: true, volume: 0.7, music: true, musicVolume: 0.6 };

  function init() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    master = ctx.createGain();
    master.connect(comp);
    sfxGain = ctx.createGain();
    sfxGain.connect(master);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
    apply();
    return true;
  }
  ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, init, { capture: true }));

  function apply() {
    if (!ctx) return;
    master.gain.setTargetAtTime(settings.on ? settings.volume : 0, ctx.currentTime, 0.02);
    musicGain.gain.setTargetAtTime(settings.music ? settings.musicVolume : 0, ctx.currentTime, 0.05);
  }

  // ---------- building blocks ----------
  const now = () => ctx.currentTime;

  /** Oscillator note with a simple attack/decay envelope. */
  function tone(freq, dur, { type = "sine", vol = 0.3, at = 0, attack = 0.005, slide, out = sfxGain, filter } = {}) {
    const t = now() + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = filter;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  let noiseBuf;
  function noise(dur, { type = "bandpass", freq = 1000, q = 1, vol = 0.3, at = 0, sweep, out = sfxGain } = {}) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = now() + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI note -> Hz
  function arp(notes, step, opts) {
    notes.forEach((n, i) => tone(N(n), opts.dur || 0.25, { ...opts, at: (opts.at || 0) + i * step }));
  }

  // ---------- the sounds ----------
  const SOUNDS = {
    click() {
      tone(1800, 0.05, { type: "square", vol: 0.06, filter: 3000 });
    },
    bet() {
      tone(900, 0.06, { type: "triangle", vol: 0.15 });
      tone(1350, 0.06, { type: "triangle", vol: 0.12, at: 0.05 });
    },
    spinStart() {
      noise(0.25, { freq: 600, sweep: 2400, q: 0.8, vol: 0.12 });
      tone(330, 0.12, { type: "triangle", vol: 0.12 });
    },
    reelTick() {
      noise(0.025, { freq: 2600, q: 3, vol: 0.05 });
    },
    reelStop(i = 0) {
      tone(140 - i * 6, 0.16, { type: "sine", vol: 0.35, slide: 70 });
      noise(0.05, { freq: 900, q: 1.5, vol: 0.12 });
    },
    larryReel(i = 0) {
      arp([76 + i * 2, 80 + i * 2, 83 + i * 2, 88 + i * 2], 0.06, { type: "triangle", vol: 0.16, dur: 0.3 });
    },
    tease() {
      tone(220, 1.8, { type: "sawtooth", vol: 0.07, slide: 880, filter: 1800, attack: 0.3 });
      tone(223, 1.8, { type: "sawtooth", vol: 0.06, slide: 886, filter: 1800, attack: 0.3 });
    },
    winTick(p = 0) {
      tone(1100 + p * 900, 0.04, { type: "square", vol: 0.05, filter: 4000 });
    },
    win() {
      arp([72, 76, 79, 84], 0.07, { type: "triangle", vol: 0.18, dur: 0.25 });
    },
    bigWin() {
      arp([60, 64, 67, 72, 76, 79, 84], 0.09, { type: "sawtooth", vol: 0.12, dur: 0.35, filter: 2600 });
      [72, 76, 79, 84].forEach((n) => tone(N(n), 1.2, { type: "triangle", vol: 0.1, at: 0.65 }));
      SOUNDS.coins(1.6);
    },
    coins(sec = 1) {
      for (let i = 0; i < sec * 22; i++) {
        const f = 2200 + Math.random() * 2600;
        tone(f, 0.08, { type: "square", vol: 0.035, at: Math.random() * sec, filter: 6000 });
        tone(f * 1.5, 0.06, { type: "sine", vol: 0.03, at: Math.random() * sec });
      }
    },
    bonus() {
      // "Bonus Initiated!" fanfare
      const brass = { type: "sawtooth", vol: 0.13, filter: 2200, dur: 0.22 };
      arp([67, 67, 67], 0.12, brass);
      tone(N(72), 0.9, { ...brass, at: 0.36, dur: 0.9 });
      [60, 64, 67, 72].forEach((n) => tone(N(n), 1.1, { type: "triangle", vol: 0.12, at: 0.36 }));
      noise(1.2, { type: "highpass", freq: 6000, vol: 0.05, at: 0.36 });
    },
    pick() {
      tone(660, 0.08, { type: "triangle", vol: 0.2 });
      tone(990, 0.12, { type: "triangle", vol: 0.18, at: 0.06 });
    },
    reveal() {
      arp([79, 83, 86, 91], 0.05, { type: "sine", vol: 0.2, dur: 0.4 });
    },
    splash() {
      noise(0.5, { type: "lowpass", freq: 3000, sweep: 300, vol: 0.35 });
      tone(320, 0.25, { type: "sine", vol: 0.2, slide: 90 });
    },
    plop() {
      tone(500, 0.12, { type: "sine", vol: 0.3, slide: 150 });
      noise(0.15, { freq: 1200, q: 2, vol: 0.1, at: 0.02 });
    },
    haul() {
      // rope creak + winch
      for (let i = 0; i < 6; i++) tone(180 + (i % 2) * 30, 0.12, { type: "sawtooth", vol: 0.05, at: i * 0.18, filter: 900 });
      noise(0.9, { type: "lowpass", freq: 1500, sweep: 400, vol: 0.12, at: 0.9 });
    },
    prize() {
      tone(N(84), 0.5, { type: "sine", vol: 0.22 });
      tone(N(88), 0.6, { type: "sine", vol: 0.2, at: 0.08 });
      SOUNDS.coins(0.4);
    },
    giant() {
      tone(55, 1.5, { type: "sine", vol: 0.5, slide: 35 });
      noise(1.4, { type: "lowpass", freq: 2500, sweep: 200, vol: 0.45 });
      arp([60, 67, 72, 76, 79, 84], 0.1, { type: "sawtooth", vol: 0.12, dur: 0.5, filter: 2400, at: 0.5 });
      SOUNDS.coins(1.5);
    },
    chest() {
      tone(240, 0.09, { type: "square", vol: 0.12, filter: 1200 });
      tone(180, 0.12, { type: "square", vol: 0.1, filter: 1000, at: 0.07 });
    },
    lookUp() {
      // two foghorn toots
      [0, 0.45].forEach((at) => {
        tone(110, 0.38, { type: "sawtooth", vol: 0.16, filter: 700, at, attack: 0.04 });
        tone(165, 0.38, { type: "sawtooth", vol: 0.1, filter: 700, at, attack: 0.04 });
      });
    },
    award() {
      arp([72, 79, 84], 0.08, { type: "triangle", vol: 0.2, dur: 0.4 });
    },
    // A bonus symbol landing: each one in a row rings higher (n = how many so far)
    scatterLand(n = 1) {
      const root = 72 + (n - 1) * 4;
      arp([root, root + 7, root + 12], 0.05, { type: "triangle", vol: 0.2, dur: 0.35 });
      tone(N(root + 24), 0.5, { type: "sine", vol: 0.08, at: 0.1 });
    },
    // The teasing reel landed without the bonus: a falling "aww"
    teaseMiss() {
      tone(N(67), 0.5, { type: "sawtooth", vol: 0.08, filter: 1400, slide: N(55) });
      tone(N(64), 0.6, { type: "triangle", vol: 0.1, slide: N(52), at: 0.05 });
    },
    // The teasing reel landed the bonus: a big hit before the bonus fanfare
    teaseHit() {
      tone(70, 0.6, { type: "sine", vol: 0.5, slide: 40 });
      noise(0.6, { type: "lowpass", freq: 4000, sweep: 300, vol: 0.3 });
      arp([72, 79, 84, 91], 0.04, { type: "square", vol: 0.08, dur: 0.3, filter: 5000 });
    },
    // Big Wheel: the pointer flicking over each peg, the shove, and the progressive fanfare
    wheelTick() {
      tone(2400, 0.03, { type: "square", vol: 0.07, filter: 5000 });
      noise(0.02, { freq: 3500, q: 4, vol: 0.06 });
    },
    wheelSpin() {
      noise(0.6, { freq: 400, sweep: 1800, q: 0.7, vol: 0.16 });
      tone(180, 0.3, { type: "triangle", vol: 0.15, slide: 360 });
    },
    jackpot() {
      const brass = { type: "sawtooth", vol: 0.12, dur: 0.5, filter: 2800 };
      arp([60, 64, 67, 72, 67, 72, 76, 79, 84, 88], 0.1, brass);
      tone(N(84), 1.6, { ...brass, at: 1.0, dur: 1.6 });
      SOUNDS.coins(2.5);
    },
    total() {
      arp([60, 64, 67, 72, 67, 72, 76, 79, 84], 0.11, { type: "triangle", vol: 0.18, dur: 0.3 });
      [72, 76, 79, 84].forEach((n) => tone(N(n), 1.6, { type: "sawtooth", vol: 0.06, filter: 2000, at: 1.0 }));
    },
  };

  // ---------- continuous reel ticking while reels spin ----------
  let tickTimer = null;
  function reelLoop(on) {
    clearInterval(tickTimer);
    tickTimer = null;
    if (on && settings.on && ctx) tickTimer = setInterval(() => SOUNDS.reelTick(), 60);
  }

  // ---------- drums (for the music) ----------
  function kick(at, vol = 0.5, out = musicGain) {
    tone(150, 0.25, { type: "sine", vol, slide: 45, at, out });
  }
  function snare(at, vol = 0.25, out = musicGain) {
    noise(0.16, { type: "highpass", freq: 1500, vol, at, out });
    tone(220, 0.08, { type: "triangle", vol: vol * 0.5, at, out });
  }
  function hat(at, vol = 0.08, out = musicGain) {
    noise(0.04, { type: "highpass", freq: 8000, vol, at, out });
  }

  // ---------- tension: a pulse that builds while a reel teases a bonus ----------
  // level 1..3: each level is faster, higher and fuller. 0 stops it.
  let tensionTimer = null;
  let tensionLevel = 0;
  let tensionNext = 0;
  let tensionStep = 0;
  function tension(level) {
    if (!init()) return;
    tensionLevel = settings.on ? level : 0;
    if (!tensionLevel) {
      clearInterval(tensionTimer);
      tensionTimer = null;
      return;
    }
    if (tensionTimer) return; // already running: the new level takes over on the next note
    tensionNext = now() + 0.03;
    tensionStep = 0;
    tensionTimer = setInterval(() => {
      const L = tensionLevel;
      const step = [0.15, 0.12, 0.095][L - 1]; // 16th notes, faster per level
      const root = [45, 47, 50][L - 1];
      while (tensionNext < now() + 0.15) {
        const at = tensionNext - now();
        const i = tensionStep++;
        // pumping bass on every 16th, kick on the beat
        tone(N(root), step * 0.8, { type: "sawtooth", vol: 0.1, filter: 500 + L * 250, at });
        if (i % 4 === 0) kick(at, 0.45, sfxGain);
        if (L >= 2 && i % 8 === 4) snare(at, 0.15, sfxGain);
        if (L >= 2) hat(at, 0.05, sfxGain);
        // a climbing figure above it, an octave higher at level 3
        const fig = [0, 3, 7, 10, 12, 10, 7, 3];
        const up = Math.floor(i / 16) % 4; // creeps up a semitone every bar
        tone(N(root + 24 + fig[i % 8] + up + (L === 3 ? 12 : 0)), step * 0.9, { type: "square", vol: 0.04 + L * 0.012, filter: 3000, at });
        // shimmering tremolo on top at level 3
        if (L === 3) tone(N(root + 48 + up), step * 0.5, { type: "sine", vol: 0.03, at });
        tensionNext += step;
      }
    }, 40);
  }

  // ---------- bonus music: a little sea shanty loop ----------
  // [melody note, beats] in 6/8; 0 = rest
  const SHANTY = [
    [62, 1], [66, 0.5], [69, 1], [66, 0.5], [69, 1], [74, 0.5], [73, 1.5],
    [71, 1], [69, 0.5], [67, 1], [71, 0.5], [69, 1], [66, 0.5], [64, 1.5],
    [62, 1], [66, 0.5], [69, 1], [66, 0.5], [69, 1], [74, 0.5], [76, 1.5],
    [74, 1], [73, 0.5], [71, 1], [67, 0.5], [66, 1], [64, 0.5], [62, 1.5],
  ];
  const BASS = [50, 50, 55, 50, 47, 50, 45, 50]; // one per 1.5 beats
  // Harmony a third/sixth under the tune, as a squeezebox-like chord pad (one per bass note)
  const CHORDS = [[62, 66, 69], [62, 66, 69], [67, 71, 74], [62, 66, 69], [59, 62, 67], [62, 66, 69], [57, 61, 64], [62, 66, 69]];
  let musicTimer = null;
  let nextNote = 0;
  let noteIdx = 0;
  let bassIdx = 0;
  let nextBass = 0;
  const BEAT = 0.36;

  function music(on) {
    if (!init()) return;
    clearInterval(musicTimer);
    musicTimer = null;
    if (!on) return;
    nextNote = nextBass = now() + 0.1;
    noteIdx = bassIdx = 0;
    musicTimer = setInterval(() => {
      // Second time round the tune goes up a step for a lift
      const lift = Math.floor(noteIdx / SHANTY.length) % 2 ? 2 : 0;
      while (nextNote < now() + 0.3) {
        const [n, beats] = SHANTY[noteIdx++ % SHANTY.length];
        const d = beats * BEAT;
        if (n) {
          tone(N(n + lift), d * 0.9, { type: "square", vol: 0.08, filter: 1800, at: nextNote - now(), out: musicGain });
          tone(N(n + lift + 12), d * 0.6, { type: "sine", vol: 0.04, at: nextNote - now(), out: musicGain });
        }
        nextNote += d;
      }
      while (nextBass < now() + 0.3) {
        const k = bassIdx++ % BASS.length;
        const b = BASS[k] + lift;
        const at = nextBass - now();
        tone(N(b), BEAT * 0.8, { type: "triangle", vol: 0.16, at, out: musicGain });
        tone(N(b + 7), BEAT * 0.4, { type: "triangle", vol: 0.07, at: at + BEAT, out: musicGain });
        // squeezebox chord on the off-beat
        CHORDS[k].forEach((c) => tone(N(c + lift), BEAT * 0.45, { type: "sawtooth", vol: 0.025, filter: 1300, at: at + BEAT * 0.5, out: musicGain }));
        // 6/8 drum groove: kick on 1, snare on 4, hats on every eighth
        kick(at, 0.35);
        snare(at + BEAT, 0.12);
        hat(at, 0.05);
        hat(at + BEAT * 0.5, 0.04);
        hat(at + BEAT, 0.05);
        nextBass += BEAT * 1.5;
      }
    }, 100);
  }

  LM.sound = {
    settings,
    play(name, arg) {
      if (!settings.on || !init() || !SOUNDS[name]) return;
      try {
        SOUNDS[name](arg);
      } catch (e) {
        /* never let a sound problem break the game */
      }
    },
    reelLoop,
    music,
    tension,
    /** Developer check: play every sound once and return the names of any that fail. */
    check() {
      init();
      return Object.keys(SOUNDS).filter((n) => {
        try {
          SOUNDS[n]();
          return false;
        } catch (e) {
          return true;
        }
      });
    },
    set(opts) {
      Object.assign(settings, opts);
      apply();
      if (!settings.on) {
        reelLoop(false);
        tension(0);
      }
    },
  };
})();
