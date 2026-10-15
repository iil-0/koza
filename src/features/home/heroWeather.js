import { useEffect, useState } from 'react';
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun,
} from 'lucide-react';

const CACHE_KEY = 'koza:weather';
const TTL = 30 * 60 * 1000;

const norm = (city) => (city || '').trim().toLocaleLowerCase('tr');

/** Cache key for a place: shared coordinates win over a typed city name */
const placeKey = ({ city, lat, lon }) =>
  lat != null && lon != null ? `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}` : norm(city);

function readCache(key) {
  try {
    const all = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
    const hit = all[key];
    if (hit && Date.now() - hit.t < TTL) return hit;
  } catch {
    /* ignore */
  }
  return null;
}

function writeCache(key, data) {
  try {
    const all = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
    all[key] = data;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

async function resolvePlace({ city, lat, lon }, signal) {
  if (lat != null && lon != null) return { lat, lon, name: city || 'Konumun' };
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=tr&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('geocode');
  const json = await res.json();
  const hit = json.results?.[0];
  if (!hit) throw new Error('not-found');
  return { lat: hit.latitude, lon: hit.longitude, name: hit.name };
}

/**
 * Current weather from Open-Meteo (no key) for the user's place — pass the
 * `user` object ({ city, lat, lon }). Cached in sessionStorage for 30 min.
 * Returns { data, failed, missing }; `missing` = no location set yet.
 */
export function useWeather({ city, lat, lon } = {}) {
  const key = placeKey({ city, lat, lon });
  const [state, setState] = useState(() => ({ key, data: key ? readCache(key) : null, failed: false }));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), TTL);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!key || readCache(key)) return undefined;
    const ctrl = new AbortController();
    (async () => {
      try {
        const place = await resolvePlace({ city, lat, lon }, ctrl.signal);
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
          '&current=temperature_2m,weather_code,is_day&timezone=auto';
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error('weather');
        const json = await res.json();
        const cur = json.current;
        if (!cur || typeof cur.temperature_2m !== 'number') throw new Error('shape');
        const data = {
          t: Date.now(),
          name: place.name,
          temp: Math.round(cur.temperature_2m),
          code: cur.weather_code,
          isDay: cur.is_day !== 0,
        };
        writeCache(key, data);
        setState({ key, data, failed: false });
      } catch (err) {
        if (err?.name !== 'AbortError') setState({ key, data: null, failed: true });
      }
    })();
    return () => ctrl.abort();
    // `tick` forces a refresh after the cache expires
  }, [key, city, lat, lon, tick]);

  if (!key) return { data: null, failed: false, missing: true };
  // state may belong to a previous place while the new request is in flight
  if (state.key !== key) return { data: readCache(key), failed: false };
  return state;
}

/** WMO weather code -> { label, icon, kind } (kind drives the window scene) */
export function describeWeather(code, isDay = true) {
  if (code === 0) return { label: 'Açık', icon: isDay ? Sun : Moon, kind: 'clear' };
  if (code === 1 || code === 2) return { label: 'Parçalı bulutlu', icon: isDay ? CloudSun : CloudMoon, kind: 'clouds' };
  if (code === 3) return { label: 'Kapalı', icon: Cloud, kind: 'overcast' };
  if (code === 45 || code === 48) return { label: 'Sisli', icon: CloudFog, kind: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Çiseliyor', icon: CloudDrizzle, kind: 'rain' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Yağmurlu', icon: CloudRain, kind: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: 'Karlı', icon: CloudSnow, kind: 'snow' };
  if (code >= 95) return { label: 'Fırtınalı', icon: CloudLightning, kind: 'rain' };
  return { label: 'Bulutlu', icon: Cloud, kind: 'clouds' };
}
