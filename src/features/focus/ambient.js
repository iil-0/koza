/* Ambient soundscapes — real field recordings from public/sounds (sources and
   licenses in public/sounds/CREDITS.md). Each recording is looped with an
   equal-power crossfade so the seam is inaudible.
   Each player: (ctx, out) => stop()   where `out` is an AudioNode. */

const XFADE = 4; // seconds of overlap between two passes of a recording
const LEAD = 8; // schedule the next pass this many seconds ahead

const decoded = new WeakMap();

/** Fetches + decodes a recording once per AudioContext. */
function load(ctx, file) {
  let cache = decoded.get(ctx);
  if (!cache) {
    cache = {};
    decoded.set(ctx, cache);
  }
  if (!cache[file]) {
    cache[file] = fetch(`${import.meta.env.BASE_URL}sounds/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${file}: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data))
      .catch((err) => {
        delete cache[file]; // allow a retry on the next toggle
        throw err;
      });
  }
  return cache[file];
}

function curve(fn) {
  const c = new Float32Array(64);
  for (let i = 0; i < c.length; i++) c[i] = fn((i / (c.length - 1)) * (Math.PI / 2));
  return c;
}
// equal-power: sin² + cos² = 1, so two uncorrelated passes keep a steady level
const FADE_IN = curve(Math.sin);
const FADE_OUT = curve(Math.cos);

/** Plays `buffer` forever, overlapping consecutive passes by XFADE seconds. */
function crossfadeLoop(ctx, buffer, out) {
  const dur = buffer.duration;
  const fade = Math.min(XFADE, dur / 4);
  const voices = new Set();
  let timer;
  let stopped = false;

  const play = (when, offset, fadeIn) => {
    const start = Math.max(when, ctx.currentTime + 0.02);
    const end = start + (dur - offset);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueCurveAtTime(FADE_IN, start, fadeIn);
    g.gain.setValueCurveAtTime(FADE_OUT, end - fade, fade);
    src.connect(g).connect(out);
    src.start(start, offset);
    src.stop(end);

    const voice = { src, g };
    voices.add(voice);
    src.onended = () => {
      voices.delete(voice);
      g.disconnect();
    };

    // the next pass starts as this one begins to fade out
    const next = end - fade;
    timer = setTimeout(() => {
      if (!stopped) play(next, 0, fade);
    }, Math.max(0, (next - ctx.currentTime - LEAD) * 1000));
  };

  // first pass: start somewhere inside the recording, with a short fade-in
  play(ctx.currentTime, Math.random() * Math.max(0, dur - 3 * fade), 1.5);

  return () => {
    stopped = true;
    clearTimeout(timer);
    voices.forEach(({ src, g }) => {
      try {
        src.stop();
        g.disconnect();
      } catch {
        /* already stopped */
      }
    });
    voices.clear();
  };
}

function recording(file) {
  return (ctx, out) => {
    let stopLoop = null;
    let cancelled = false;
    load(ctx, file)
      .then((buffer) => {
        if (!cancelled) stopLoop = crossfadeLoop(ctx, buffer, out);
      })
      .catch((err) => console.warn('Ortam sesi yüklenemedi:', err));
    return () => {
      cancelled = true;
      if (stopLoop) stopLoop();
    };
  };
}

export const SOUNDSCAPES = {
  rain: recording('rain.mp3'),
  cafe: recording('cafe.mp3'),
  waves: recording('waves.mp3'),
  fireplace: recording('fireplace.mp3'),
};
