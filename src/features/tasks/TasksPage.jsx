import { useEffect, useMemo, useState } from 'react';
import {
  AlarmClock, Archive, CalendarDays, ChevronDown, CircleCheck, Hourglass, Inbox, Plus, Search, Sun, Sunrise, X,
} from 'lucide-react';
import { useApp, useListMap } from '../../store/useApp';
import { formatWithDay } from '../../lib/date';
import TaskRow from './TaskRow';
import TaskModal from './TaskModal';
import { compareTasks, compareTasksByDate, sectionOf } from './taskUtils';
import './TasksPage.css';

const SECTIONS = [
  { id: 'overdue', label: 'Gecikmiş', icon: AlarmClock, color: 'coral' },
  { id: 'today', label: 'Bugün', icon: Sun, color: 'yellow' },
  { id: 'tomorrow', label: 'Yarın', icon: Sunrise, color: 'peach' },
  { id: 'week', label: 'Bu hafta', icon: CalendarDays, color: 'lavender' },
  { id: 'later', label: 'Daha sonra', icon: Hourglass, color: 'blue' },
  { id: 'nodate', label: 'Tarihsiz', icon: Inbox, color: 'sage' },
  { id: 'past', label: 'Geçmiş tamamlananlar', icon: CircleCheck, color: 'sage' },
];

const STATUSES = [
  { id: 'all', label: 'Tümü' },
  { id: 'active', label: 'Aktif' },
  { id: 'done', label: 'Tamamlanan' },
  { id: 'starred', label: 'Yıldızlı' },
];

const FILTER_KEY = 'koza:listFilter';

function readInitialFilter() {
  try {
    return sessionStorage.getItem(FILTER_KEY) || 'all';
  } catch {
    return 'all';
  }
}

const normalize = (s) => s.toLocaleLowerCase('tr-TR');

function TasksPage() {
  const { today, todos, lists, archiveCompleted } = useApp();
  const listMap = useListMap();
  const [listFilter, setListFilter] = useState(readInitialFilter);
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [collapsed, setCollapsed] = useState({ past: true });

  // sidebar hand-off: one-shot sessionStorage value + live window event
  useEffect(() => {
    try {
      sessionStorage.removeItem(FILTER_KEY);
    } catch {
      /* ignore */
    }
    const onFilter = (e) => setListFilter(e.detail || 'all');
    window.addEventListener('koza:list-filter', onFilter);
    return () => window.removeEventListener('koza:list-filter', onFilter);
  }, []);

  const activeList = listFilter !== 'all' && listMap[listFilter] ? listFilter : 'all';

  const live = useMemo(() => todos.filter((t) => !t.archived), [todos]);
  const activeCount = live.filter((t) => !t.completed).length;
  const doneCount = live.length - activeCount;

  const listCounts = useMemo(() => {
    const map = {};
    live.forEach((t) => {
      if (!t.completed) map[t.listId] = (map[t.listId] || 0) + 1;
    });
    return map;
  }, [live]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return live.filter((t) => {
      if (activeList !== 'all' && t.listId !== activeList) return false;
      if (status === 'active' && t.completed) return false;
      if (status === 'done' && !t.completed) return false;
      if (status === 'starred' && !t.starred) return false;
      if (q && !normalize(t.text).includes(q)) return false;
      return true;
    });
  }, [live, activeList, status, query]);

  const groups = useMemo(() => {
    const map = Object.fromEntries(SECTIONS.map((s) => [s.id, []]));
    filtered.forEach((t) => map[sectionOf(t, today)].push(t));
    Object.entries(map).forEach(([id, arr]) => {
      if (id === 'past') arr.sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));
      else if (id === 'today' || id === 'tomorrow' || id === 'nodate') arr.sort(compareTasks);
      else arr.sort(compareTasksByDate);
    });
    return map;
  }, [filtered, today]);

  const todayActive = live.filter((t) => t.date === today && !t.completed).length;
  const overdueCount = live.filter((t) => sectionOf(t, today) === 'overdue').length;
  const isFiltering = query.trim() || status !== 'all' || activeList !== 'all';

  const subtitle =
    todayActive === 0
      ? 'Bugün için yapılacak kalmadı — kendine bir kahve ısmarla ☕'
      : `Bugün ${todayActive} görevin var${overdueCount ? `, ${overdueCount} tanesi bekliyor` : ''} — adım adım.`;

  return (
    <div className="tp">
      <header className="page-head">
        <div>
          <p className="tp-date hand">{formatWithDay(today)}</p>
          <h1 className="page-title">Görevler</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={18} aria-hidden="true" />
          Görev Ekle
        </button>
      </header>

      <section className="card tp-card">
        <div className="tp-toolbar">
          <div className="tp-search">
            <Search size={17} aria-hidden="true" />
            <label htmlFor="tp-search" className="sr-only">
              Görevlerde ara
            </label>
            <input
              id="tp-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
              placeholder="Görevlerde ara…"
              autoComplete="off"
            />
            {query && (
              <button type="button" className="tp-search-clear" aria-label="Aramayı temizle" onClick={() => setQuery('')}>
                <X size={15} />
              </button>
            )}
          </div>

          <div className="tp-seg" role="group" aria-label="Duruma göre filtrele">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={status === s.id}
                onClick={() => setStatus(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tp-lists" role="group" aria-label="Listeye göre filtrele">
          <button type="button" className="chip" aria-pressed={activeList === 'all'} onClick={() => setListFilter('all')}>
            Tümü <span className="count">{activeCount}</span>
          </button>
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              className="chip tp-chip"
              data-color={l.color}
              aria-pressed={activeList === l.id}
              onClick={() => setListFilter(activeList === l.id ? 'all' : l.id)}
            >
              <span className="dot" aria-hidden="true" />
              {l.name}
              <span className="count">{listCounts[l.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="tp-sections">
          {filtered.length === 0 ? (
            <div className="empty tp-empty">
              <svg viewBox="0 0 64 48" width="72" height="54" aria-hidden="true" className="tp-empty-art">
                <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 10h30l6 6v26H14z" />
                  <path d="M44 10v6h6M21 22h20M21 29h14M21 36h9" />
                </g>
                <path d="M53 34c-2.5-3-7.2-.5-5 3l5 5 5-5c2.2-3.5-2.5-6-5-3Z" className="tp-empty-heart" />
              </svg>
              <p className="hand">{isFiltering ? 'Bu filtrede görev bulamadım…' : 'Liste tertemiz — yeni bir şey ekle ✿'}</p>
              {isFiltering && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                    setListFilter('all');
                  }}
                >
                  Filtreleri temizle
                </button>
              )}
            </div>
          ) : (
            SECTIONS.filter((s) => groups[s.id].length > 0).map((s) => {
              const SIcon = s.icon;
              const isOpen = !collapsed[s.id];
              const items = groups[s.id];
              const headId = `tp-sec-${s.id}`;
              return (
                <section key={s.id} className={`tp-section${isOpen ? '' : ' is-collapsed'}`} aria-labelledby={headId}>
                  <h2 className="tp-section-head" id={headId}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setCollapsed((c) => ({ ...c, [s.id]: isOpen }))}
                    >
                      <span className="tp-section-icon" data-color={s.color} aria-hidden="true">
                        <SIcon size={16} />
                      </span>
                      <span className="tp-section-label">{s.label}</span>
                      <span className="tp-section-count">{items.length}</span>
                      {s.id === 'today' && <span className="tp-section-hint hand">bugün senin günün</span>}
                      <ChevronDown size={18} className="tp-chev" aria-hidden="true" />
                    </button>
                  </h2>
                  {isOpen && (
                    <ul className="task-list">
                      {items.map((t) => (
                        <TaskRow
                          key={t.id}
                          todo={t}
                          list={listMap[t.listId]}
                          today={today}
                          showDate={s.id !== 'today'}
                          onEdit={(task) => setModal({ task })}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </div>

        <footer className="tp-foot">
          <p className="tp-stats">
            <strong>{activeCount}</strong> aktif <span aria-hidden="true">·</span> <strong>{doneCount}</strong> tamamlandı
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={doneCount === 0}
            onClick={archiveCompleted}
          >
            <Archive size={15} aria-hidden="true" />
            Tamamlananları arşivle
          </button>
        </footer>
      </section>

      <TaskModal
        open={!!modal}
        task={modal?.task}
        defaults={{ date: today, listId: activeList !== 'all' ? activeList : undefined }}
        onClose={() => setModal(null)}
      />

    </div>
  );
}

export default TasksPage;
