import { createContext, useContext } from 'react';

export const FocusTimerContext = createContext(null);

/** Access the global focus timer (state + actions). */
export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) throw new Error('useFocusTimer must be used inside <FocusTimerProvider>');
  return ctx;
}

export const MODES = ['pomodoro', 'short', 'long'];

export const MODE_LABELS = {
  pomodoro: 'Pomodoro',
  short: 'Kısa Mola',
  long: 'Uzun Mola',
};

/** Little handwritten caption under the clock */
export const MODE_MOODS = {
  pomodoro: 'odak zamanı',
  short: 'bir nefes al',
  long: 'çay molası',
};

export const DEFAULT_SETTINGS = {
  pomodoro: 25,
  short: 5,
  long: 15,
  longEvery: 4,
  autoStart: false,
  sound: true,
};

export const SETTINGS_KEY = 'koza:focusSettings';
export const TIMER_KEY = 'koza:focusTimer';

const clampInt = (v, min, max, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function sanitizeSettings(raw = {}) {
  const s = { ...DEFAULT_SETTINGS, ...raw };
  return {
    pomodoro: clampInt(s.pomodoro, 1, 180, DEFAULT_SETTINGS.pomodoro),
    short: clampInt(s.short, 1, 60, DEFAULT_SETTINGS.short),
    long: clampInt(s.long, 1, 90, DEFAULT_SETTINGS.long),
    longEvery: clampInt(s.longEvery, 2, 8, DEFAULT_SETTINGS.longEvery),
    autoStart: Boolean(s.autoStart),
    sound: Boolean(s.sound),
  };
}

const pad = (n) => String(n).padStart(2, '0');

/** 1453 -> '24:13' */
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
