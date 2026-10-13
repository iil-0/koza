import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileClock, GraduationCap, PartyPopper, Plane } from 'lucide-react';
import { MONTHS, addDays, diffDays, fromKey, monthGrid, toKey, weekdayMon } from '../../lib/date';

export const EVENT_TYPES = {
  exam: { label: 'Sınav', color: 'coral', Icon: GraduationCap },
  deadline: { label: 'Teslim', color: 'peach', Icon: FileClock },
  event: { label: 'Etkinlik', color: 'lavender', Icon: PartyPopper },
  trip: { label: 'Seyahat', color: 'blue', Icon: Plane },
};

export const EVENT_TYPE_KEYS = Object.keys(EVENT_TYPES);

export const eventType = (type) => EVENT_TYPES[type] || EVENT_TYPES.event;

/** key -> { todos: [], events: [] } (archived todos excluded) */
export function buildDayIndex(todos, events) {
  const idx = {};
  const at = (k) => (idx[k] ||= { todos: [], events: [] });
  todos.forEach((t) => {
    if (!t.archived && t.date) at(t.date).todos.push(t);
  });
  events.forEach((e) => {
    if (e.date) at(e.date).events.push(e);
  });
  Object.values(idx).forEach((d) =>
    d.todos.sort((a, b) => Number(a.completed) - Number(b.completed) || (a.time || '99').localeCompare(b.time || '99'))
  );
  return idx;
}

export function useDayIndex(todos, events) {
  return useMemo(() => buildDayIndex(todos, events), [todos, events]);
}

/** Count summary like "2 görev · 1 etkinlik" */
export function countLabel(day) {
  if (!day) return '';
  const parts = [];
  if (day.todos.length) parts.push(`${day.todos.length} görev`);
  if (day.events.length) parts.push(`${day.events.length} etkinlik`);
  return parts.join(' · ');
}

/** Up to `max` palette colors for the tiny dots under a day number */
export function dayDots(day, listMap, max = 3) {
  if (!day) return [];
  const colors = [
    ...day.events.map((e) => eventType(e.type).color),
    ...day.todos.map((t) => listMap[t.listId]?.color || 'blue'),
  ];
  return colors.slice(0, max);
}

/** 'Bugün' / 'Yarın' / '3 gün kaldı' / 'Dün' / '4 gün önce' */
export function relativeLabel(today, key) {
  const d = diffDays(today, key);
  if (d === 0) return 'Bugün';
  if (d === 1) return 'Yarın';
  if (d === -1) return 'Dün';
  return d > 0 ? `${d} gün kaldı` : `${-d} gün önce`;
}

/** Grid of keys, trimmed to 5 rows when the 6th row is entirely next month */
export function visibleGrid(year, month) {
  const grid = monthGrid(year, month);
  return fromKey(grid[35]).getMonth() !== month ? grid.slice(0, 35) : grid;
}

export const monthLabel = (y, m) => `${MONTHS[m]} ${y}`;

/**
 * Month navigation + roving-tabindex keyboard support for a day grid.
 * Arrow keys move the selection, PageUp/PageDown change month, Home/End jump within the week.
 */
export function useMonthNav(initialKey) {
  const [selected, setSelected] = useState(initialKey);
  const [cursor, setCursor] = useState(() => {
    const d = fromKey(initialKey);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const gridRef = useRef(null);
  const focusPending = useRef(false);

  const grid = useMemo(() => visibleGrid(cursor.y, cursor.m), [cursor]);
  const firstOfMonth = toKey(new Date(cursor.y, cursor.m, 1));
  const focusKey = grid.includes(selected) ? selected : firstOfMonth;

  const select = useCallback((key, focus = false) => {
    setSelected(key);
    const d = fromKey(key);
    setCursor((c) => (c.y === d.getFullYear() && c.m === d.getMonth() ? c : { y: d.getFullYear(), m: d.getMonth() }));
    focusPending.current = focus;
  }, []);

  const shiftMonth = useCallback((delta) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }, []);

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    gridRef.current?.querySelector(`[data-key="${selected}"]`)?.focus();
  });

  const onGridKeyDown = useCallback(
    (e) => {
      const base = focusKey;
      const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      let next = null;
      if (e.key in moves) next = addDays(base, moves[e.key]);
      else if (e.key === 'Home') next = addDays(base, -weekdayMon(fromKey(base)));
      else if (e.key === 'End') next = addDays(base, 6 - weekdayMon(fromKey(base)));
      else if (e.key === 'PageUp' || e.key === 'PageDown') {
        const d = fromKey(base);
        const target = new Date(d.getFullYear(), d.getMonth() + (e.key === 'PageUp' ? -1 : 1), 1);
        const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        target.setDate(Math.min(d.getDate(), last));
        next = toKey(target);
      }
      if (next) {
        e.preventDefault();
        select(next, true);
      }
    },
    [focusKey, select]
  );

  return { selected, select, cursor, setCursor, shiftMonth, grid, focusKey, gridRef, onGridKeyDown };
}
