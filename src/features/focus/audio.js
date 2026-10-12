/* Shared WebAudio helpers for the focus feature.
   The AudioContext is created lazily (only from a user gesture, e.g. "Başlat"
   or an ambient-sound toggle) and reused for the whole session. */

let ctx = null;

/** Returns the shared AudioContext. Pass create=false to only read it. */
export function getAudioContext(create = true) {
  if (!ctx && create) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** A gentle three-note bell chime (soft sine partials, low-passed). */
export function playChime(volume = 0.2) {
  const ac = getAudioContext(false);
  if (!ac || ac.state === 'closed') return;
  const start = ac.currentTime + 0.03;

  const master = ac.createGain();
  master.gain.value = volume;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3800;
  master.connect(lp).connect(ac.destination);

  // E5 · G#5 · B5 · E6 — a warm major arpeggio
  const notes = [659.25, 830.61, 987.77, 1318.51];
  const partials = [
    [1, 0.5, 2.2],
    [2.01, 0.14, 1.4],
    [3.98, 0.05, 0.8],
  ];
  notes.forEach((freq, i) => {
    const t = start + i * 0.17;
    partials.forEach(([mult, peak, decay]) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + decay + 0.05);
    });
  });

  setTimeout(() => {
    try {
      lp.disconnect();
    } catch {
      /* already gone */
    }
  }, 3600);
}
