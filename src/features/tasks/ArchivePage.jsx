import { useMemo, useState } from 'react';
import { Check, Circle, Trash2, Undo2 } from 'lucide-react';
import { useApp, useListMap } from '../../store/useApp';
import { MONTHS, toKey } from '../../lib/date';
import ConfirmDialog from './ConfirmDialog';
import { relativeDate } from './taskUtils';
import './ArchivePage.css';

/** Which day a task "belongs" to in the archive */
const archiveKey = (t) => t.date || (t.completedAt ? toKey(new Date(t.completedAt)) : toKey(new Date(t.createdAt || Date.now())));

function EmptyBox() {
  return (
    <svg className="ar-box" viewBox="0 0 120 96" width="140" height="112" aria-hidden="true">
      <ellipse cx="60" cy="88" rx="42" ry="5" className="ar-box-shadow" />
      <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" stroke="currentColor">
        {/* box body */}
        <path d="M24 42 60 52l36-10v34L60 86 24 76Z" className="ar-box-body" />
        <path d="M60 52v34" fill="none" />
        {/* open flaps */}
        <path d="M24 42 12 30l36-9 12 11Z" className="ar-box-flap" />
        <path d="M96 42l12-12-36-9-12 11Z" className="ar-box-flap" />
        {/* tiny label */}
        <path d="M70 64l16-4.5v7L70 71Z" className="ar-box-label" />
      </g>
      {/* floating heart + sparkles */}
      <path className="ar-box-heart" d="M60 22c-3-4-9.5-1.2-7 3.8L60 32l7-6.2c2.5-5-4-7.8-7-3.8Z" />
      <g className="ar-box-spark" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M36 12v6M33 15h6" />
        <path d="M88 8v5M85.5 10.5h5" />
      </g>
    </svg>
  );
}

function ArchivePage() {
  const { today, todos, restoreTodo, deleteTodo } = useApp();
  const listMap = useListMap();
  const [confirm, setConfirm] = useState(null); // { type: 'one', todo } | { type: 'all' }

  const archived = useMemo(() => todos.filter((t) => t.archived), [todos]);

  const groups = useMemo(() => {
    const map = new Map();
    [...archived]
      .sort((a, b) => (archiveKey(a) < archiveKey(b) ? 1 : archiveKey(a) > archiveKey(b) ? -1 : 0))
      .forEach((t) => {
        const ym = archiveKey(t).slice(0, 7);
        if (!map.has(ym)) map.set(ym, []);
        map.get(ym).push(t);
      });
    return [...map.entries()].map(([ym, items]) => {
      const [y, m] = ym.split('-').map(Number);
      return { ym, label: `${MONTHS[m - 1]} ${y}`, items };
    });
  }, [archived]);

  const doneCount = archived.filter((t) => t.completed).length;

  return (
    <div className="ar">
      <header className="page-head">
        <div>
          <h1 className="page-title">Arşiv</h1>
          <p className="page-sub">
            {archived.length
              ? `${archived.length} görev burada dinleniyor · ${doneCount} tanesi tamamlanmıştı.`
              : 'Kaldırdığın görevler burada saklanır.'}
          </p>
        </div>
        {archived.length > 0 && (
          <button type="button" className="btn task-btn-danger" onClick={() => setConfirm({ type: 'all' })}>
            <Trash2 size={16} aria-hidden="true" />
            Arşivi boşalt
          </button>
        )}
      </header>

      {archived.length === 0 ? (
        <section className="card ar-empty">
          <EmptyBox />
          <p className="hand ar-empty-line">Arşiv bomboş — hafif bir zihin, hafif bir gün ✿</p>
          <p className="ar-empty-sub">Görevlerdeki “⋯” menüsünden “Arşivle”yi seçtiğinde buraya gelirler.</p>
        </section>
      ) : (
        <div className="ar-groups">
          {groups.map((g, gi) => (
            <section key={g.ym} className="card ar-group rise" style={{ animationDelay: `${gi * 60}ms` }} aria-labelledby={`ar-${g.ym}`}>
              <h2 className="ar-month" id={`ar-${g.ym}`}>
                <span className="hand">{g.label}</span>
                <span className="ar-month-count">{g.items.length} görev</span>
              </h2>
              <ul className="ar-list">
                {g.items.map((t) => {
                  const list = listMap[t.listId];
                  return (
                    <li key={t.id} className={`ar-row${t.completed ? ' is-done' : ''}`}>
                      <span className="ar-state" aria-hidden="true">
                        {t.completed ? <Check size={14} strokeWidth={3} /> : <Circle size={14} />}
                      </span>
                      <div className="ar-main">
                        <span className="ar-text">
                          {t.text}
                          <span className="sr-only">{t.completed ? ' (tamamlanmış)' : ' (tamamlanmamış)'}</span>
                        </span>
                        <span className="ar-meta">
                          {list && (
                            <span className="tag" data-color={list.color}>
                              {list.name}
                            </span>
                          )}
                          <span className="ar-date">{relativeDate(t.date, today)}</span>
                        </span>
                      </div>
                      <div className="ar-actions">
                        <button type="button" className="btn btn-soft btn-sm" onClick={() => restoreTodo(t.id)}>
                          <Undo2 size={15} aria-hidden="true" />
                          <span className="ar-btn-label">Geri al</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm ar-del"
                          aria-label={`"${t.text}" görevini kalıcı olarak sil`}
                          onClick={() => setConfirm({ type: 'one', todo: t })}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          <span className="ar-btn-label">Kalıcı sil</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'all' ? 'Arşivi boşalt' : 'Kalıcı olarak sil'}
        message={
          confirm?.type === 'all'
            ? `Arşivdeki ${archived.length} görev kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : `“${confirm?.todo?.text ?? ''}” kalıcı olarak silinecek. Bu işlem geri alınamaz.`
        }
        confirmLabel={confirm?.type === 'all' ? 'Hepsini sil' : 'Sil'}
        onConfirm={() => {
          if (confirm?.type === 'all') archived.forEach((t) => deleteTodo(t.id));
          else if (confirm?.todo) deleteTodo(confirm.todo.id);
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

export default ArchivePage;
