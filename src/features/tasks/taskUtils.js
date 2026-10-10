import { addDays, diffDays, fromKey, MONTHS, toKey, weekKeys } from '../../lib/date';

export const DEFAULT_LIST = 'kisisel';

/** 'Eki' style short month names */
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const DAYS_SHORT_SUN = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/**
 * Sort: incomplete first, then by time (tasks without a time go last),
 * starred tasks win ties, then oldest first.
 */
export function compareTasks(a, b) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const at = a.time || '';
  const bt = b.time || '';
  if (!!at !== !!bt) return at ? -1 : 1;
  if (at !== bt) return at < bt ? -1 : 1;
  if (a.starred !== b.starred) return a.starred ? -1 : 1;
  return (a.createdAt || 0) - (b.createdAt || 0);
}

/** Sort that also orders by date first (for multi-day sections) */
export function compareTasksByDate(a, b) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const ad = a.date || '9999';
  const bd = b.date || '9999';
  if (ad !== bd) return ad < bd ? -1 : 1;
  return compareTasks(a, b);
}

export const isOverdue = (todo, today) => !todo.completed && !!todo.date && todo.date < today;

export const completedOn = (todo, dayKey) => !!todo.completedAt && toKey(new Date(todo.completedAt)) === dayKey;

/** Human relative date: Bugün / Yarın / Dün / 'Pzt 13 Eki' */
export function relativeDate(key, today) {
  if (!key) return 'Tarihsiz';
  const diff = diffDays(today, key);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff === -1) return 'Dün';
  const d = fromKey(key);
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  if (Math.abs(diff) < 7) return `${DAYS_SHORT_SUN[d.getDay()]} ${base}`;
  return sameYear ? base : `${base} ${d.getFullYear()}`;
}

/** 'Yarına ertele' target: never moves a task backwards in time */
export function postponeTarget(todo, today) {
  const from = todo.date && todo.date > today ? todo.date : today;
  return addDays(from, 1);
}

/** Bucket used by the Görevler page */
export function sectionOf(todo, today) {
  if (!todo.date) return 'nodate';
  if (todo.date < today) return todo.completed ? 'past' : 'overdue';
  if (todo.date === today) return 'today';
  const tomorrow = addDays(today, 1);
  if (todo.date === tomorrow) return 'tomorrow';
  const weekEnd = weekKeys(today)[6];
  if (todo.date <= weekEnd) return 'week';
  return 'later';
}
