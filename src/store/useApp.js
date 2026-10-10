import { createContext, useContext, useMemo } from 'react';

export const AppContext = createContext(null);

/** App state + actions (see AppProvider in AppStore.jsx). */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/** Lists keyed by id: { [listId]: list } */
export function useListMap() {
  const { lists } = useApp();
  return useMemo(() => Object.fromEntries(lists.map((l) => [l.id, l])), [lists]);
}
