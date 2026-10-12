/* Procedural ambient soundscapes — pure WebAudio, no audio files.
   Each generator: (ctx, out) => stop()   where `out` is an AudioNode. */

const buffers = new WeakMap();

function noise(ctx, kind) {
  let cache = buffers.get(ctx);
  if (!cache) {
    cache = {};
    buffers.set(ctx, cache);
  }
  if (cache[kind]) return cache[kind];

  const len = Math.floor(ctx.sampleRate * 4);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);

  if (kind === 'white') {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } else if (kind === 'brown') {
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
  } else {
    // pink (Paul Kellet's refined method)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  cache[kind] = buf;
  return buf;
}

function loop(ctx, kind) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx, kind);
  src.loop = true;
  // start at a random point so layered loops don't phase together
  src.start(0, Math.random() * 3.5);
  return src;
}

function filter(ctx, type, frequency, Q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = Q;
  return f;
}

function gain(ctx, value) {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

/** Short filtered noise burst — a raindrop, a crackle, a pop. */
function burst(ctx, out, { freq, q = 4, type = 'bandpass', peak, decay }) {
  const t = ctx.currentTime + 0.005;
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx, 'white');
  const f = filter(ctx, type, freq, q);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 3, decay + 0.05);
}

/** Random scheduler that can be cancelled. */
function scatter(fn, minMs, maxMs) {
  let alive = true;
  let id;
  const next = () => {
    if (!alive) return;
    fn();
    id = setTimeout(next, minMs + Math.random() * (maxMs - minMs));
  };
  id = setTimeout(next, minMs + Math.random() * (maxMs - minMs));
  return () => {
    alive = false;
    clearTimeout(id);
  };
}

function stopAll(nodes, cancels) {
  cancels.forEach((c) => c());
  nodes.forEach((n) => {
    try {
      if (n.stop) n.stop();
      n.disconnect();
    } catch {
      /* already stopped */
    }
  });
}

/* ---------------- soundscapes ---------------- */

function rain(ctx, out) {
  // steady hiss of rainfall
  const bed = loop(ctx, 'pink');
  const hp = filter(ctx, 'highpass', 450);
  const lp = filter(ctx, 'lowpass', 5200);
  const g = gain(ctx, 0.55);
  bed.connect(hp).connect(lp).connect(g).connect(out);

  // distant low rumble on the roof
  const low = loop(ctx, 'brown');
  const lowLp = filter(ctx, 'lowpass', 260);
  const lowG = gain(ctx, 0.35);
  low.connect(lowLp).connect(lowG).connect(out);

  // individual drops on the window
  const dropBus = gain(ctx, 0.9);
  dropBus.connect(out);
  const cancel = scatter(
    () =>
      burst(ctx, dropBus, {
        freq: 1800 + Math.random() * 4200,
        q: 6 + Math.random() * 6,
        peak: 0.12 + Math.random() * 0.4,
        decay: 0.02 + Math.random() * 0.05,
      }),
    18,
    140
  );
  return () => stopAll([bed, low, g, lowG, dropBus], [cancel]);
}

function cafe(ctx, out) {
  // warm room tone
  const room = loop(ctx, 'brown');
  const lp = filter(ctx, 'lowpass', 520);
  const g = gain(ctx, 0.8);
  room.connect(lp).connect(g).connect(out);

  // murmur of voices: band-passed pink noise with a slow, uneven swell
  const murmur = loop(ctx, 'pink');
  const bp = filter(ctx, 'bandpass', 650, 1.1);
  const mg = gain(ctx, 0.18);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.23;
  const depth = gain(ctx, 0.07);
  lfo.connect(depth).connect(mg.gain);
  lfo.start();
  murmur.connect(bp).connect(mg).connect(out);

  // occasional cup / spoon clinks
  const clinkBus = gain(ctx, 1);
  clinkBus.connect(out);
  const cancel = scatter(
    () => {
      const t = ctx.currentTime + 0.01;
      const base = 2300 + Math.random() * 1400;
      [1, 2.76].forEach((m, i) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = base * m;
        const og = ctx.createGain();
        const peak = (0.035 + Math.random() * 0.04) / (i + 1);
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(peak, t + 0.004);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(og).connect(clinkBus);
        o.start(t);
        o.stop(t + 0.4);
      });
    },
    2500,
    8000
  );
  return () => stopAll([room, murmur, lfo, g, mg, clinkBus], [cancel]);
}

function waves(ctx, out) {
  // the swell: lowpassed noise whose cutoff + volume breathe like the tide
  const sea = loop(ctx, 'pink');
  const lp = filter(ctx, 'lowpass', 650);
  const g = gain(ctx, 0.45);
  sea.connect(lp).connect(g).connect(out);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08; // ~12 s per wave
  const freqDepth = gain(ctx, 480);
  const volDepth = gain(ctx, 0.38);
  lfo.connect(freqDepth).connect(lp.frequency);
  lfo.connect(volDepth).connect(g.gain);
  lfo.start();

  // foam hiss that crests with the wave
  const foam = loop(ctx, 'white');
  const hp = filter(ctx, 'highpass', 2600);
  const fg = gain(ctx, 0.025);
  const foamDepth = gain(ctx, 0.022);
  lfo.connect(foamDepth).connect(fg.gain);
  foam.connect(hp).connect(fg).connect(out);

  // deep undertow
  const deep = loop(ctx, 'brown');
  const dlp = filter(ctx, 'lowpass', 180);
  const dg = gain(ctx, 0.5);
  deep.connect(dlp).connect(dg).connect(out);

  return () => stopAll([sea, foam, deep, lfo, g, fg, dg], []);
}

function fireplace(ctx, out) {
  // low roar of the flames
  const roar = loop(ctx, 'brown');
  const lp = filter(ctx, 'lowpass', 340);
  const g = gain(ctx, 0.75);
  roar.connect(lp).connect(g).connect(out);

  // airy hiss
  const hiss = loop(ctx, 'pink');
  const bp = filter(ctx, 'bandpass', 1300, 0.8);
  const hg = gain(ctx, 0.05);
  hiss.connect(bp).connect(hg).connect(out);

  const crackBus = gain(ctx, 1);
  crackBus.connect(out);
  const cancelCrackle = scatter(
    () => {
      // crackles come in little clusters
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        setTimeout(
          () =>
            burst(ctx, crackBus, {
              type: 'highpass',
              freq: 1400 + Math.random() * 3000,
              q: 0.8,
              peak: 0.08 + Math.random() * 0.35,
              decay: 0.004 + Math.random() * 0.012,
            }),
          i * (8 + Math.random() * 30)
        );
      }
    },
    40,
    320
  );
  const cancelPop = scatter(
    () =>
      burst(ctx, crackBus, {
        freq: 500 + Math.random() * 700,
        q: 2,
        peak: 0.4 + Math.random() * 0.3,
        decay: 0.04 + Math.random() * 0.04,
      }),
    1500,
    5000
  );
  return () => stopAll([roar, hiss, g, hg, crackBus], [cancelCrackle, cancelPop]);
}

export const SOUNDSCAPES = { rain, cafe, waves, fireplace };
