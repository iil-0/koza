import { Coffee, Heart, Leaf, Lightbulb, Sparkles, Star } from 'lucide-react';

/** Sticky-note paper colors (store values) with Turkish labels */
export const NOTE_COLORS = [
  { id: 'yellow', label: 'Sarı' },
  { id: 'pink', label: 'Pembe' },
  { id: 'blue', label: 'Mavi' },
  { id: 'sage', label: 'Yeşil' },
  { id: 'lavender', label: 'Lila' },
  { id: 'peach', label: 'Şeftali' },
];

/** Little doodle drawn in the corner of each paper color */
export const NOTE_DOODLES = {
  blue: Lightbulb,
  pink: Heart,
  yellow: Star,
  sage: Leaf,
  lavender: Sparkles,
  peach: Coffee,
};

/** Small, stable string hash (for rotation etc.) */
export function hashString(str = '') {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pinned first, then newest first */
export function sortNotes(notes) {
  return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.createdAt || 0) - (a.createdAt || 0));
}

/** Cozy writing prompts for the "ilham" button */
export const PROMPTS = [
  { title: 'Bugün minnettar olduğum 3 şey:', body: '1. \n2. \n3. ' },
  { title: 'Beni bugün gülümseten küçük şey:', body: '' },
  { title: 'Yarınki bana bir not:', body: 'Sevgili ben,\n' },
  { title: 'Bu hafta kendime iyi davranmak için:', body: '- \n- \n- ' },
  { title: 'Okumak istediğim kitaplar:', body: '- \n- \n- ' },
  { title: 'Bu ay öğrenmek istediğim bir şey:', body: '' },
  { title: 'Huzur bulduğum yerler:', body: '- \n- ' },
  { title: 'Yağmurlu gün çalma listem:', body: '♪ \n♪ \n♪ ' },
  { title: 'Gurur duyduğum küçük bir an:', body: '' },
  { title: 'Bir sonraki kahve molamda düşüneceğim:', body: '' },
  { title: 'Hayalimdeki sakin bir pazar günü:', body: '' },
  { title: 'Kendime hatırlatma:', body: 'Yavaş da olsa ilerliyorsun. ♡' },
];

export function randomPrompt() {
  const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)].id;
  return { ...p, color };
}
