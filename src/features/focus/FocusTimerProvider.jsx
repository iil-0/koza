import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { getAudioContext, playChime } from './audio';
import {
  FocusTimerContext,
  MODES,
  MODE_LABELS,
  SETTINGS_KEY,
  TIMER_KEY,
  formatTime,
  sanitizeSettings,
  useFocusTimer,
} from './focusShared';

/* --------------------------------------------------------------------------
   Global pomodoro timer. Lives above the pages so it keeps ticking while the
   user navigates. Time is derived from an absolute end timestamp, so it stays
   accurate in throttled background tabs and resumes after a refresh.
   -------------------------------------------------------------------------- */

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function freshTimer(settings, mode = 'pomodoro', cycle = 0) {
  const total = settings[mode] * 60;
  return { mode, total, remaining: total, running: false, endAt: null, cycle };
}

function loadTimer(settings) {
  const saved = readJSON(TIMER_KEY);
  if (!saved || !MODES.includes(saved.mode)) return freshTimer(settings);
  const total = Number(saved.total) > 0 ? Number(saved.total) : settings[saved.mode] * 60;
  const remaining = Math.min(total, Math.max(0, Number(saved.remaining) || total));
  const running = Boolean(saved.running && saved.endAt);
  return {
    mode: saved.mode,
    total,
    remaining,
    running,
    endAt: running ? Number(saved.endAt) : null,
    cycle: Math.max(0, Number(saved.cycle) || 0),
  };
}

function notify(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(title, { body, tag: 'koza-focus', silent: true });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* some browsers only allow notifications from a service worker */
  }
}

function askNotificationPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      const p = Notification.requestPermission();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export function FocusTimerProvider({ children }) {
  const { logFocusSession } = useApp();

  const [settings, setSettings] = useState(() => sanitizeSettings(readJSON(SETTINGS_KEY) || {}));
  const [timer, setTimer] = useState(() => loadTimer(settings));
  const [now, setNow] = useState(() => Date.now());

  const timerRef = useRef(timer);
  const settingsRef = useRef(settings);
  const handledEndRef = useRef(null);
  const baseTitleRef = useRef(null);

  /** Single write path: ref (for callbacks), state (for render), storage (for refresh) */
  const commit = useCallback((next) => {
    timerRef.current = next;
    setTimer(next);
    writeJSON(TIMER_KEY, next);
  }, []);

  /* ---------- completion ---------- */
  const finish = useCallback(() => {
    const t = timerRef.current;
    const s = settingsRef.current;
    // guard against double-completion (StrictMode, visibility + interval racing)
    if (handledEndRef.current === t.endAt) return;
    handledEndRef.current = t.endAt;

    let cycle = t.cycle;
    let nextMode;
    if (t.mode === 'pomodoro') {
      logFocusSession(Math.max(1, Math.round(t.total / 60)));
      cycle += 1;
      nextMode = cycle >= s.longEvery ? 'long' : 'short';
      notify(
        'Seans tamamlandı 🌱',
        nextMode === 'long'
          ? `Harika gidiyorsun! ${s.long} dakikalık uzun bir mola hak ettin.`
          : `Güzel iş! Şimdi ${s.short} dakikalık kısa bir mola zamanı.`
      );
    } else {
      if (t.mode === 'long') cycle = 0;
      nextMode = 'pomodoro';
      notify('Mola bitti ☕', 'Hazırsan yeni bir odak seansı seni bekliyor.');
    }

    if (s.sound) playChime();

    const total = s[nextMode] * 60;
    const nowMs = Date.now();
    commit({
      mode: nextMode,
      total,
      remaining: total,
      running: s.autoStart,
      endAt: s.autoStart ? nowMs + total * 1000 : null,
      cycle,
    });
    setNow(nowMs);
  }, [commit, logFocusSession]);

  /* ---------- ticking ---------- */
  useEffect(() => {
    if (!timer.running) return undefined;
    const tick = () => {
      const t = timerRef.current;
      if (!t.running || !t.endAt) return;
      if (Date.now() >= t.endAt) finish();
      else setNow(Date.now());
    };
    const id = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [timer.running, timer.endAt, finish]);

  const remaining = timer.running
    ? Math.max(0, Math.ceil((timer.endAt - now) / 1000))
    : timer.remaining;

  /* ---------- tab title ---------- */
  useEffect(() => {
    if (baseTitleRef.current === null) baseTitleRef.current = document.title;
    document.title = timer.running ? `⏱ ${formatTime(remaining)} · koza` : baseTitleRef.current;
  }, [timer.running, remaining]);

  useEffect(
    () => () => {
      if (baseTitleRef.current !== null) document.title = baseTitleRef.current;
    },
    []
  );

  /* ---------- actions ---------- */
  const start = useCallback(() => {
    const t = timerRef.current;
    if (t.running) return;
    // We're inside a click: the right moment to unlock audio & ask for notifications.
    if (settingsRef.current.sound) getAudioContext();
    askNotificationPermission();
    const nowMs = Date.now();
    const secs = t.remaining > 0 ? t.remaining : t.total;
    commit({ ...t, remaining: secs, running: true, endAt: nowMs + secs * 1000 });
    setNow(nowMs);
  }, [commit]);

  const pause = useCallback(() => {
    const t = timerRef.current;
    if (!t.running) return;
    const secs = Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000));
    commit({ ...t, remaining: secs, running: false, endAt: null });
  }, [commit]);

  const toggle = useCallback(() => (timerRef.current.running ? pause() : start()), [pause, start]);

  const reset = useCallback(() => {
    const t = timerRef.current;
    commit({ ...t, remaining: t.total, running: false, endAt: null });
  }, [commit]);

  const setMode = useCallback(
    (mode) => {
      if (!MODES.includes(mode)) return;
      const t = timerRef.current;
      commit({ ...freshTimer(settingsRef.current, mode, t.cycle) });
    },
    [commit]
  );

  /** Jump to the next phase without logging the current one. */
  const skip = useCallback(() => {
    const t = timerRef.current;
    const s = settingsRef.current;
    let cycle = t.cycle;
    let nextMode;
    if (t.mode === 'pomodoro') nextMode = cycle + 1 >= s.longEvery ? 'long' : 'short';
    else {
      if (t.mode === 'long') cycle = 0;
      nextMode = 'pomodoro';
    }
    const total = s[nextMode] * 60;
    const nowMs = Date.now();
    commit({
      mode: nextMode,
      total,
      remaining: total,
      running: t.running,
      endAt: t.running ? nowMs + total * 1000 : null,
      cycle,
    });
    setNow(nowMs);
  }, [commit]);

  const updateSettings = useCallback(
    (patch) => {
      const next = sanitizeSettings({ ...settingsRef.current, ...patch });
      settingsRef.current = next;
      setSettings(next);
      writeJSON(SETTINGS_KEY, next);
      const t = timerRef.current;
      const total = next[t.mode] * 60;
      if (!t.running && total !== t.total) commit({ ...t, total, remaining: total });
    },
    [commit]
  );

  const previewSound = useCallback(() => {
    getAudioContext();
    playChime();
  }, []);

  const value = useMemo(
    () => ({
      mode: timer.mode,
      modeLabel: MODE_LABELS[timer.mode],
      running: timer.running,
      remaining,
      total: timer.total,
      progress: timer.total > 0 ? remaining / timer.total : 0,
      cycle: timer.cycle,
      settings,
      start,
      pause,
      toggle,
      reset,
      skip,
      setMode,
      updateSettings,
      previewSound,
    }),
    [timer, remaining, settings, start, pause, toggle, reset, skip, setMode, updateSettings, previewSound]
  );

  return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export { useFocusTimer };
