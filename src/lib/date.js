export const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// Monday-first short names for calendar headers
export const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const pad = (n) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' in local time */
export function toKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 'YYYY-MM-DD' -> Date (local midnight) */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toKey(new Date());

export function addDays(key, amount) {
  const date = fromKey(key);
  date.setDate(date.getDate() + amount);
  return toKey(date);
}

/** Days from `a` to `b` (b - a), both keys */
export function diffDays(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}

/** '10 Ekim 2026' */
export function formatLong(key) {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** '10 Ekim 2026, Cumartesi' */
export function formatWithDay(key) {
  return `${formatLong(key)}, ${DAYS[fromKey(key).getDay()]}`;
}

/** Monday-first weekday index 0..6 */
export const weekdayMon = (date) => (date.getDay() + 6) % 7;

/** Keys for Mon..Sun of the week containing `key` */
export function weekKeys(key = todayKey()) {
  const start = addDays(key, -weekdayMon(fromKey(key)));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 6x7 grid of keys for a month view (Monday-first), includes overflow days */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = toKey(new Date(year, month, 1 - weekdayMon(first)));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}
