// First-visit defaults. Every visitor starts with a clean slate; only generic
// lists and habit templates are provided so the app doesn't feel empty.

/** lat/lon are set when the user shares their location; city is a display name */
export const seedUser = () => ({ name: '', motto: '', city: '', lat: null, lon: null, avatar: 'bruno', onboarded: false });

/** color = one of the palette tokens: pink, blue, peach, sage, lavender, coral, yellow */
export const seedLists = () => [
  { id: 'kisisel', name: 'Kişisel', color: 'blue' },
  { id: 'okul', name: 'Okul', color: 'pink' },
  { id: 'is', name: 'İş', color: 'peach' },
  { id: 'saglik', name: 'Sağlık', color: 'sage' },
  { id: 'alisveris', name: 'Alışveriş', color: 'lavender' },
];

export const seedTodos = () => [];

/** icon = lucide icon name in kebab-case (see src/components/habitIcons.js) */
export const seedHabits = () => [
  { id: 'su', name: 'Su iç', icon: 'cup-soda', color: 'sage', target: 8, unit: 'bardak', log: {} },
  { id: 'egzersiz', name: 'Egzersiz', icon: 'dumbbell', color: 'coral', target: 4, unit: 'set', log: {} },
  { id: 'kitap', name: 'Kitap oku', icon: 'book-open', color: 'blue', target: 4, unit: 'bölüm', log: {} },
];

/** type: exam | deadline | event | trip */
export const seedEvents = () => [];

/** color: blue | pink | yellow | sage | lavender | peach */
export const seedNotes = () => [];
