import { addDays } from '../../lib/date';

export const HABIT_COLORS = [
  { id: 'sage', label: 'Yeşil' },
  { id: 'blue', label: 'Mavi' },
  { id: 'coral', label: 'Mercan' },
  { id: 'pink', label: 'Pembe' },
  { id: 'peach', label: 'Şeftali' },
  { id: 'yellow', label: 'Sarı' },
  { id: 'lavender', label: 'Lila' },
];

export const countOn = (habit, key) => habit.log?.[key] || 0;

/** 0..1 completion for a day */
export const ratioOn = (habit, key) => Math.min(1, countOn(habit, key) / Math.max(1, habit.target));

export const doneOn = (habit, key) => countOn(habit, key) >= habit.target;

/** Consecutive completed days ending today (or yesterday if today isn't done yet) */
export function currentStreak(habit, today) {
  let day = doneOn(habit, today) ? today : addDays(today, -1);
  let n = 0;
  while (doneOn(habit, day) && n < 3650) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

/** Longest run of completed days in the log */
export function bestStreak(habit, today) {
  const keys = Object.keys(habit.log || {}).filter((k) => k <= today).sort();
  if (!keys.length) return 0;
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of keys) {
    if (!doneOn(habit, k)) {
      run = 0;
      prev = k;
      continue;
    }
    run = prev && addDays(prev, 1) === k && run > 0 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

/** Heatmap level 0..4 from a 0..1 ratio */
export function level(ratio) {
  if (ratio <= 0) return 0;
  if (ratio < 0.34) return 1;
  if (ratio < 0.67) return 2;
  if (ratio < 1) return 3;
  return 4;
}
