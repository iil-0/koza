/** Selectable bear avatars (stored as user.avatar). Each id has its own drawing in BearAvatar.jsx. */
export const BEARS = [
  { id: 'bruno', name: 'Bruno', desc: 'Boz ayı' },
  { id: 'olaf', name: 'Olaf', desc: 'Kutup ayısı' },
  { id: 'mei', name: 'Mei', desc: 'Panda' },
  { id: 'sol', name: 'Sol', desc: 'Güneş ayısı' },
  { id: 'theo', name: 'Theo', desc: 'Oyuncak ayı' },
  { id: 'felix', name: 'Felix', desc: 'Gözlüklü ayı' },
  { id: 'hugo', name: 'Hugo', desc: 'Bereli kara ayı' },
];

export const DEFAULT_BEAR = 'bruno';

/** Unknown ids (e.g. from older versions) fall back to the default bear. */
export const bearById = (id) => BEARS.find((b) => b.id === id) || BEARS.find((b) => b.id === DEFAULT_BEAR);
