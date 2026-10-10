/** Unique id for stored records (todos, notes, lists…). */
export const uid = () =>
  globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
