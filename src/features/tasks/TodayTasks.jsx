import { useId, useMemo, useState } from 'react';
import { Plus, Sun } from 'lucide-react';
import { useApp, useListMap } from '../../store/useApp';
import TaskRow from './TaskRow';
import TaskModal from './TaskModal';
import PlanNote from './PlanNote';
import { DEFAULT_LIST, compareTasks, completedOn } from './taskUtils';
import './TodayTasks.css';

function TodayTasks() {
  const { today, todos, lists, addTodo } = useApp();
  const listMap = useListMap();
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | { task? }
  const [quick, setQuick] = useState('');
  const quickId = useId();

  // today's tasks + overdue unfinished ones (+ overdue ones finished today, so they don't vanish)
  const rows = useMemo(
    () =>
      todos
        .filter(
          (t) =>
            !t.archived &&
            (t.date === today || (t.date && t.date < today && (!t.completed || completedOn(t, today))))
        )
        .sort((a, b) => {
          // overdue unfinished ones float to the top of the active group
          const ao = !a.completed && a.date < today;
          const bo = !b.completed && b.date < today;
          if (ao !== bo) return ao ? -1 : 1;
          return compareTasks(a, b);
        }),
    [todos, today]
  );

  const counts = useMemo(() => {
    const map = {};
    rows.forEach((t) => {
      map[t.listId] = (map[t.listId] || 0) + 1;
    });
    return map;
  }, [rows]);

  // keep list order from the sidebar
  const chipLists = lists.filter((l) => counts[l.id]);
  const active = filter !== 'all' && counts[filter] ? filter : 'all';
  const visible = active === 'all' ? rows : rows.filter((t) => t.listId === active);

  const doneCount = rows.filter((t) => t.completed).length;
  const pct = rows.length ? Math.round((doneCount / rows.length) * 100) : 0;

  const quickAdd = (e) => {
    e.preventDefault();
    const text = quick.trim();
    if (!text) return;
    const fallback = listMap[DEFAULT_LIST] ? DEFAULT_LIST : lists[0]?.id || DEFAULT_LIST;
    addTodo({ text, date: today, listId: active !== 'all' ? active : fallback });
    setQuick('');
  };

  const quickList = listMap[active !== 'all' ? active : DEFAULT_LIST];

  return (
    <section className="card tt" aria-labelledby={`${quickId}-title`}>
      <header className="card-head tt-head">
        <h2 className="card-title" id={`${quickId}-title`}>
          <Sun size={22} className="tt-sun" aria-hidden="true" />
          Bugünün Görevleri
        </h2>

        <div className="tt-chips scroll-thin" role="group" aria-label="Listeye göre filtrele">
          <button type="button" className="chip" aria-pressed={active === 'all'} onClick={() => setFilter('all')}>
            Tümü <span className="count">{rows.length}</span>
          </button>
          {chipLists.map((l) => (
            <button
              key={l.id}
              type="button"
              className="chip tt-chip"
              data-color={l.color}
              aria-pressed={active === l.id}
              onClick={() => setFilter(active === l.id ? 'all' : l.id)}
            >
              {l.name.split(' /')[0]} <span className="count">{counts[l.id]}</span>
            </button>
          ))}
        </div>

        <button type="button" className="btn btn-soft tt-add" aria-label="Görev ekle" onClick={() => setModal({})}>
          <Plus size={17} aria-hidden="true" />
          <span className="tt-add-label">Görev Ekle</span>
        </button>
      </header>

      <div className="tt-body">
        <div className="tt-main">
          {rows.length > 0 && (
            <div
              className="tt-progress"
              role="progressbar"
              aria-label="Bugünün ilerlemesi"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <span className="tt-track">
                <span style={{ width: `${pct}%` }} />
              </span>
              <em className="hand">
                {doneCount === rows.length ? 'hepsi bitti, harikasın ♡' : `${doneCount}/${rows.length} bitti`}
              </em>
            </div>
          )}

          {visible.length > 0 ? (
            <ul className="task-list tt-list">
              {visible.map((t) => (
                <TaskRow
                  key={t.id}
                  todo={t}
                  list={listMap[t.listId]}
                  today={today}
                  onEdit={(task) => setModal({ task })}
                />
              ))}
            </ul>
          ) : (
            <div className="empty tt-empty">
              <span className="tt-empty-cup" aria-hidden="true">☕</span>
              <p className="hand">Bugün için görev yok — keyfine bak</p>
              <p className="tt-empty-sub">Aşağıdan hızlıca bir şey ekleyebilirsin.</p>
            </div>
          )}

          <form className="tt-quick" onSubmit={quickAdd}>
            <Plus size={18} aria-hidden="true" className="tt-quick-icon" />
            <label htmlFor={quickId} className="sr-only">
              Hızlı görev ekle
            </label>
            <input
              id={quickId}
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQuick('')}
              placeholder="Hızlı görev ekle…"
              maxLength={140}
              autoComplete="off"
            />
            {quickList && (
              <span className="tag tt-quick-tag" data-color={quickList.color}>
                <span className="sr-only">Liste: </span>
                {quickList.name}
              </span>
            )}
            <kbd className="tt-kbd" aria-hidden="true">
              Enter
            </kbd>
          </form>
        </div>

        <PlanNote key={today} today={today} />
      </div>

      <TaskModal
        open={!!modal}
        task={modal?.task}
        defaults={{ date: today, listId: active !== 'all' ? active : undefined }}
        onClose={() => setModal(null)}
      />
    </section>
  );
}

export default TodayTasks;
