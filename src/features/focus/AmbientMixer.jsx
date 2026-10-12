import { useEffect, useRef, useState } from 'react';
import { CloudRain, Coffee, Flame, Headphones, VolumeX, Waves } from 'lucide-react';
import { getAudioContext } from './audio';
import { SOUNDSCAPES } from './ambient';

const SOUNDS = [
  { id: 'rain', name: 'Yağmur', hint: 'cama vuran damlalar', Icon: CloudRain, color: 'lavender' },
  { id: 'cafe', name: 'Kafe uğultusu', hint: 'fincan şıngırtıları', Icon: Coffee, color: 'peach' },
  { id: 'waves', name: 'Dalga', hint: 'kıyıya vuran deniz', Icon: Waves, color: 'blue' },
  { id: 'fireplace', name: 'Şömine', hint: 'çıtırdayan odunlar', Icon: Flame, color: 'coral' },
];

const VOL_KEY = 'koza:ambientVolumes';
const DEFAULT_VOLS = { rain: 0.6, cafe: 0.5, waves: 0.6, fireplace: 0.55 };

function loadVols() {
  try {
    return { ...DEFAULT_VOLS, ...JSON.parse(localStorage.getItem(VOL_KEY) || '{}') };
  } catch {
    return DEFAULT_VOLS;
  }
}

/** perceptual volume curve */
const level = (v) => Math.pow(Math.min(1, Math.max(0, v)), 2) * 0.9;

function teardown(node, fadeMs = 500) {
  const ctx = getAudioContext(false);
  if (ctx) node.gain.gain.setTargetAtTime(0, ctx.currentTime, fadeMs / 4000);
  setTimeout(() => {
    node.stop();
    try {
      node.gain.disconnect();
    } catch {
      /* noop */
    }
  }, fadeMs);
}

function AmbientMixer() {
  const [active, setActive] = useState({});
  const [vols, setVols] = useState(loadVols);
  const nodesRef = useRef({});

  // stop everything when leaving the page
  useEffect(() => {
    const nodes = nodesRef.current;
    return () => {
      Object.keys(nodes).forEach((id) => {
        teardown(nodes[id], 120);
        delete nodes[id];
      });
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(VOL_KEY, JSON.stringify(vols));
    } catch {
      /* ignore */
    }
  }, [vols]);

  const toggle = (id) => {
    const nodes = nodesRef.current;
    if (nodes[id]) {
      teardown(nodes[id]);
      delete nodes[id];
      setActive((a) => ({ ...a, [id]: false }));
      return;
    }
    const ctx = getAudioContext(); // created inside the click → allowed to play
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const stop = SOUNDSCAPES[id](ctx, gain);
    gain.gain.setTargetAtTime(level(vols[id]), ctx.currentTime, 0.5);
    nodes[id] = { gain, stop };
    setActive((a) => ({ ...a, [id]: true }));
  };

  const changeVol = (id, value) => {
    const v = Number(value);
    setVols((p) => ({ ...p, [id]: v }));
    const node = nodesRef.current[id];
    const ctx = getAudioContext(false);
    if (node && ctx) node.gain.gain.setTargetAtTime(level(v), ctx.currentTime, 0.05);
  };

  const stopAll = () => {
    const nodes = nodesRef.current;
    Object.keys(nodes).forEach((id) => {
      teardown(nodes[id]);
      delete nodes[id];
    });
    setActive({});
  };

  const anyOn = SOUNDS.some((s) => active[s.id]);

  return (
    <section className="card fp-ambient" aria-labelledby="fp-ambient-title">
      <header className="card-head">
        <h2 className="card-title" id="fp-ambient-title">
          <Headphones size={20} aria-hidden="true" /> Ortam sesi
          <span className="fp-ambient-sub hand">karıştır, kendi köşeni yarat</span>
        </h2>
        {anyOn && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={stopAll}>
            <VolumeX size={16} aria-hidden="true" /> Hepsini sustur
          </button>
        )}
      </header>

      <ul className="fp-sounds">
        {SOUNDS.map(({ id, name, hint, Icon, color }) => {
          const on = Boolean(active[id]);
          return (
            <li key={id} className="fp-sound" data-color={color} data-on={on || undefined}>
              <button type="button" className="fp-sound-toggle" aria-pressed={on} onClick={() => toggle(id)}>
                <span className="fp-sound-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <span className="fp-sound-text">
                  <strong>{name}</strong>
                  <small>{on ? 'çalıyor' : hint}</small>
                </span>
                <span className="fp-eq" aria-hidden="true">
                  <i /> <i /> <i /> <i />
                </span>
              </button>
              <label className="fp-sound-vol">
                <span className="sr-only">{name} ses seviyesi</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={vols[id]}
                  onChange={(e) => changeVol(id, e.target.value)}
                  style={{ '--val': `${Math.round(vols[id] * 100)}%` }}
                  aria-valuetext={`%${Math.round(vols[id] * 100)}`}
                />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default AmbientMixer;
