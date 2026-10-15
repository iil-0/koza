import { useEffect, useRef, useState } from 'react';
import { MapPin, Moon, RotateCcw, Sun, Sunrise, Sunset } from 'lucide-react';
import { useApp } from '../../store/useApp';
import { formatWithDay, greeting } from '../../lib/date';
import HeroArt from './HeroArt';
import { describeWeather, useWeather } from './heroWeather';
import './HeroScene.css';

const MOODS = [
  { id: 'sabah', label: 'Sabah', icon: Sunrise },
  { id: 'gun', label: 'Gün', icon: Sun },
  { id: 'aksam', label: 'Akşam', icon: Sunset },
  { id: 'gece', label: 'Gece', icon: Moon },
];

const QUOTES = [
  'Bugün de kendin için bir şey yap ♡',
  'Yavaş ama emin adımlarla ♡',
  'Bir çay koy, bir işe başla.',
  'Küçük adımlar da sayılır ♡',
  'Kendine nazik ol, gerisi gelir.',
  'Nefes al. Bir şey seç. Başla.',
  'Bugün, dünden biraz daha iyi ♡',
];

const PREVIEW_MS = 60_000;
const QUOTE_MS = 16_000;

const pad = (n) => String(n).padStart(2, '0');
const clockString = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function moodForHour(h) {
  if (h >= 5 && h < 10) return 'sabah';
  if (h >= 10 && h < 17) return 'gun';
  if (h >= 17 && h < 20) return 'aksam';
  return 'gece';
}

/** 'HH:MM' that only changes (and re-renders) once a minute */
function useClock() {
  const [time, setTime] = useState(clockString);
  useEffect(() => {
    const id = setInterval(() => setTime(clockString()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/** Crop the 1000x400 scene around the cozy corner on narrow cards */
function useSceneViewBox(ref) {
  const [viewBox, setViewBox] = useState('0 0 1000 400');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const aspect = width / height;
      if (aspect >= 2.5) {
        setViewBox('0 0 1000 400');
        return;
      }
      const w = Math.max(400, 400 * aspect);
      const x0 = Math.min(1000 - w, Math.max(0, 600 - w / 2));
      setViewBox(`${Math.round(x0)} 0 ${Math.round(w)} 400`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return viewBox;
}

function HeroQuote() {
  const [index, setIndex] = useState(() => new Date().getDate() % QUOTES.length);
  useEffect(() => {
    const id = setTimeout(() => setIndex((i) => (i + 1) % QUOTES.length), QUOTE_MS);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <button
      type="button"
      className="hero-quote hand"
      onClick={() => setIndex((i) => (i + 1) % QUOTES.length)}
      title="Başka bir söz"
    >
      <span key={index} className="hero-quote-text">
        {QUOTES[index]}
      </span>
      <span className="sr-only"> — sonraki söz için tıkla</span>
    </button>
  );
}

function HeroWeather({ city, weather, onAddPlace }) {
  const { data, failed, missing } = weather;
  if (missing) {
    return (
      <button type="button" className="hero-weather is-empty hero-weather-add" onClick={onAddPlace}>
        <MapPin size={15} aria-hidden="true" />
        <span>Hava durumu için konum ekle</span>
      </button>
    );
  }
  if (!data) {
    return (
      <p className="hero-weather is-empty">
        <MapPin size={15} aria-hidden="true" />
        <span>{city || 'Konumun'}</span>
        <span aria-label={failed ? 'Hava durumu alınamadı' : 'Hava durumu yükleniyor'}>{failed ? '—' : '…'}</span>
      </p>
    );
  }
  const desc = describeWeather(data.code, data.isDay);
  const WeatherIcon = desc.icon;
  return (
    <p className="hero-weather" title={`${data.name}: ${desc.label}`}>
      <WeatherIcon size={30} strokeWidth={1.7} className="hero-weather-icon" aria-hidden="true" />
      <span className="hero-weather-text">
        <strong>{data.temp}°C</strong>
        <span>
          {data.name}
          <span className="hero-weather-label"> · {desc.label}</span>
        </span>
      </span>
    </p>
  );
}

function HeroScene() {
  const { today, user, updateUser } = useApp();
  const rootRef = useRef(null);
  const time = useClock();
  const viewBox = useSceneViewBox(rootRef);
  // ?sahne=sabah|gun|aksam|gece previews a mood on load (handy for demos)
  const [preview, setPreview] = useState(() => {
    const q = new URLSearchParams(window.location.search).get('sahne');
    return MOODS.some((m) => m.id === q) ? q : null;
  });
  const weather = useWeather(user);
  const weatherKind = weather.data ? describeWeather(weather.data.code, weather.data.isDay).kind : 'clear';

  const hour = Number(time.slice(0, 2));
  const autoMood = moodForHour(hour);
  const mood = preview || autoMood;
  const MoodIcon = MOODS.find((m) => m.id === mood)?.icon || Sun;

  // previewing a mood is temporary: drift back to real time after a minute
  useEffect(() => {
    if (!preview) return undefined;
    const id = setTimeout(() => setPreview(null), PREVIEW_MS);
    return () => clearTimeout(id);
  }, [preview]);

  const [hh, mm] = time.split(':');

  return (
    <section className="hero" data-mood={mood} ref={rootRef} aria-label="Günün sahnesi">
      <HeroArt mood={mood} weather={weatherKind} viewBox={viewBox} city={user.city} />
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-hello">
        <p className="hero-greet">
          <MoodIcon size={14} aria-hidden="true" />
          {greeting(new Date(`2000-01-01T${time}`))}
          {user.name ? `, ${user.name}` : ''}
        </p>
        <HeroQuote />
      </div>

      <div className="hero-info">
        <p className="hero-date">{formatWithDay(today)}</p>
        <p className="hero-clock">
          <time dateTime={time} aria-label={`Saat ${time}`}>
            {hh}
            <span className="hero-colon" aria-hidden="true">
              :
            </span>
            {mm}
          </time>
        </p>
        <HeroWeather city={user.city} weather={weather} onAddPlace={() => updateUser({ onboarded: false })} />
      </div>

      <div className="hero-moods" role="group" aria-label="Sahnenin saati">
        {MOODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`hero-mood${mood === id ? ' is-on' : ''}${!preview && autoMood === id ? ' is-auto' : ''}`}
            aria-pressed={mood === id}
            aria-label={`${label} sahnesi`}
            title={label}
            onClick={() => setPreview(id === autoMood ? null : id)}
          >
            <Icon size={15} />
          </button>
        ))}
        {preview && (
          <button type="button" className="hero-mood hero-mood--auto" onClick={() => setPreview(null)} title="Gerçek saate dön">
            <RotateCcw size={13} aria-hidden="true" /> Oto
          </button>
        )}
      </div>
    </section>
  );
}

export default HeroScene;
