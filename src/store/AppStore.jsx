import { useCallback, useEffect, useMemo, useState } from 'react';
import { todayKey } from '../lib/date';
import { uid } from '../lib/uid';
import { AppContext } from './useApp';
import { seedEvents, seedHabits, seedLists, seedNotes, seedTodos, seedUser } from './seed';

const PREFIX = 'koza:';
const LEGACY_PREFIX = 'gunce:'; // the app's previous name
const DATA_VERSION = '2';

try {
  // carry data saved under the old name over to the new prefix
  Object.keys(localStorage)
    .filter((k) => k.startsWith(LEGACY_PREFIX))
    .forEach((k) => {
      const next = PREFIX + k.slice(LEGACY_PREFIX.length);
      if (localStorage.getItem(next) === null) localStorage.setItem(next, localStorage.getItem(k));
      localStorage.removeItem(k);
    });

  // v1 shipped personal demo data (tasks, notes, name, city). Wipe it once so
  // every visitor starts clean; the theme choice is kept.
  if (localStorage.getItem(`${PREFIX}version`) !== DATA_VERSION) {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX) && k !== `${PREFIX}theme`)
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(`${PREFIX}version`, DATA_VERSION);
  }
} catch {
  /* storage unavailable */
}

function usePersistent(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(PREFIX + key);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      /* storage unavailable: fall back to seed */
    }
    return typeof initial === 'function' ? initial() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* ignore quota / privacy mode errors */
    }
  }, [key, value]);

  return [value, setValue];
}

const VIEWS = ['home', 'tasks', 'calendar', 'focus', 'habits', 'notes', 'archive'];
const viewFromHash = () => {
  const v = window.location.hash.replace('#/', '').replace('#', '');
  return VIEWS.includes(v) ? v : 'home';
};

export function AppProvider({ children }) {
  const [todos, setTodos] = usePersistent('todos', seedTodos);
  const [lists, setLists] = usePersistent('lists', seedLists);
  const [notes, setNotes] = usePersistent('notes', seedNotes);
  const [habits, setHabits] = usePersistent('habits', seedHabits);
  const [events, setEvents] = usePersistent('events', seedEvents);
  const [user, setUser] = usePersistent('user', seedUser);
  const [focusLog, setFocusLog] = usePersistent('focusLog', {});
  const [theme, setTheme] = usePersistent('theme', 'light');
  const [view, setViewState] = useState(viewFromHash);
  const [today, setToday] = useState(todayKey);

  // Keep `today` fresh if the tab stays open past midnight
  useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onHash = () => setViewState(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setView = useCallback((next) => {
    window.location.hash = next === 'home' ? '/' : `/${next}`;
    setViewState(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ---------- todos ---------- */
  const addTodo = useCallback(
    (data) => {
      const todo = {
        id: uid(),
        text: '',
        completed: false,
        completedAt: null,
        listId: 'kisisel',
        date: todayKey(),
        time: '',
        starred: false,
        archived: false,
        createdAt: Date.now(),
        ...data,
      };
      setTodos((prev) => [...prev, todo]);
      return todo;
    },
    [setTodos]
  );
  const updateTodo = useCallback(
    (id, patch) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [setTodos]
  );
  const toggleTodo = useCallback(
    (id) =>
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed, completedAt: t.completed ? null : Date.now() } : t
        )
      ),
    [setTodos]
  );
  /** Soft delete: moves to Arşiv */
  const archiveTodo = useCallback((id) => updateTodo(id, { archived: true }), [updateTodo]);
  const restoreTodo = useCallback((id) => updateTodo(id, { archived: false }), [updateTodo]);
  /** Hard delete (from Arşiv) */
  const deleteTodo = useCallback((id) => setTodos((prev) => prev.filter((t) => t.id !== id)), [setTodos]);
  const archiveCompleted = useCallback(
    () => setTodos((prev) => prev.map((t) => (t.completed ? { ...t, archived: true } : t))),
    [setTodos]
  );

  /* ---------- lists ---------- */
  const addList = useCallback(
    ({ name, color }) => {
      const list = { id: uid(), name, color };
      setLists((prev) => [...prev, list]);
      return list;
    },
    [setLists]
  );
  const deleteList = useCallback(
    (id) => {
      setLists((prev) => prev.filter((l) => l.id !== id));
      setTodos((prev) => prev.map((t) => (t.listId === id ? { ...t, listId: 'kisisel' } : t)));
    },
    [setLists, setTodos]
  );

  /* ---------- notes ---------- */
  const addNote = useCallback(
    (data) => {
      const note = { id: uid(), title: '', body: '', color: 'yellow', pinned: false, createdAt: Date.now(), ...data };
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    [setNotes]
  );
  const updateNote = useCallback(
    (id, patch) => setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n))),
    [setNotes]
  );
  const deleteNote = useCallback((id) => setNotes((prev) => prev.filter((n) => n.id !== id)), [setNotes]);

  /* ---------- habits ---------- */
  const setHabitCount = useCallback(
    (id, count, date = todayKey()) =>
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, log: { ...h.log, [date]: Math.max(0, Math.min(h.target, count)) } } : h))
      ),
    [setHabits]
  );
  const incrementHabit = useCallback(
    (id, date = todayKey()) =>
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== id) return h;
          const cur = h.log[date] || 0;
          // tapping a full habit wraps back to 0
          return { ...h, log: { ...h.log, [date]: cur >= h.target ? 0 : cur + 1 } };
        })
      ),
    [setHabits]
  );
  const addHabit = useCallback(
    (data) => setHabits((prev) => [...prev, { id: uid(), name: '', icon: 'sparkles', color: 'lavender', target: 1, log: {}, ...data }]),
    [setHabits]
  );
  const updateHabit = useCallback(
    (id, patch) => setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h))),
    [setHabits]
  );
  const deleteHabit = useCallback((id) => setHabits((prev) => prev.filter((h) => h.id !== id)), [setHabits]);

  /* ---------- events ---------- */
  const addEvent = useCallback(
    (data) => setEvents((prev) => [...prev, { id: uid(), title: '', date: todayKey(), type: 'exam', ...data }]),
    [setEvents]
  );
  const deleteEvent = useCallback((id) => setEvents((prev) => prev.filter((e) => e.id !== id)), [setEvents]);

  /* ---------- focus ---------- */
  /** Call when a pomodoro (work) session completes. minutes = session length */
  const logFocusSession = useCallback(
    (minutes) =>
      setFocusLog((prev) => {
        const key = todayKey();
        const cur = prev[key] || { sessions: 0, minutes: 0 };
        return { ...prev, [key]: { sessions: cur.sessions + 1, minutes: cur.minutes + minutes } };
      }),
    [setFocusLog]
  );

  const updateUser = useCallback((patch) => setUser((prev) => ({ ...prev, ...patch })), [setUser]);
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [setTheme]);

  const resetAll = useCallback(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      today, view, setView, theme, toggleTheme, user, updateUser, resetAll,
      todos, addTodo, updateTodo, toggleTodo, archiveTodo, restoreTodo, deleteTodo, archiveCompleted,
      lists, addList, deleteList,
      notes, addNote, updateNote, deleteNote,
      habits, incrementHabit, setHabitCount, addHabit, updateHabit, deleteHabit,
      events, addEvent, deleteEvent,
      focusLog, logFocusSession,
    }),
    [
      today, view, setView, theme, toggleTheme, user, updateUser, resetAll,
      todos, addTodo, updateTodo, toggleTodo, archiveTodo, restoreTodo, deleteTodo, archiveCompleted,
      lists, addList, deleteList,
      notes, addNote, updateNote, deleteNote,
      habits, incrementHabit, setHabitCount, addHabit, updateHabit, deleteHabit,
      events, addEvent, deleteEvent,
      focusLog, logFocusSession,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

