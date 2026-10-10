import { useEffect, useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { uid } from '../../lib/uid';
import './TodayTasks.css';

const storageKey = (day) => `koza:plan:${day}`;

function loadPlan(day) {
  try {
    const raw = localStorage.getItem(storageKey(day));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* storage unavailable */
  }
  return [];
}

/** Tiny doodle cat (sleepy face) */
export function DoodleCat({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 32" width="40" height="32" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path className="tt-cat-head" d="M9.5 14 8.6 5.2l6.6 4.6q4.8-1.7 9.6 0l6.6-4.6-.9 8.8q3.4 6.3-2.1 11Q24 27.6 20 27.6T11.6 25q-5.5-4.7-2.1-11Z" />
        <path d="M14 17.4q1.6 1.5 3.2 0M22.8 17.4q1.6 1.5 3.2 0" />
        <path d="M19.4 20.2h1.2l-.6.7Z" />
        <path d="M20 20.9q-.6 1.6-2.2 1.1M20 20.9q.6 1.6 2.2 1.1" />
        <path d="M8 19.2 3.4 18.6M8.4 21.6l-4.2 1.3M32 19.2l4.6-.6M31.6 21.6l4.2 1.3" />
      </g>
      <ellipse cx="13.4" cy="20.6" rx="1.6" ry="1" className="tt-cat-blush" />
      <ellipse cx="26.6" cy="20.6" rx="1.6" ry="1" className="tt-cat-blush" />
    </svg>
  );
}

function Smiley() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 3.2c5 0 8.8 3.6 8.6 8.9-.2 5-4 8.6-8.8 8.5-4.9-.1-8.6-3.9-8.4-8.9.2-4.8 3.9-8.4 8.6-8.5Z" />
        <path d="M9 9.8v.6M15 9.8v.6" />
        <path d="M8.2 14q3.8 3.6 7.6 0" />
      </g>
    </svg>
  );
}

/** "Bugünün Planı" sticky note. Mount with key={today} so it resets each day. */
function PlanNote({ today }) {
  const [items, setItems] = useState(() => loadPlan(today));
  const [draft, setDraft] = useState('');
  const inputId = useId();

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(today), JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [today, items]);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [...prev, { id: uid(), text, done: false }]);
    setDraft('');
  };

  const doneCount = items.filter((i) => i.done).length;

  return (
    <aside className="tt-side" aria-label="Bugünün planı">
      <div className="tt-note" data-color="peach">
        <span className="tt-tape" aria-hidden="true" />
        <div className="tt-note-head">
          <h3 className="hand">Bugünün Planı</h3>
          <DoodleCat className="tt-cat" />
        </div>

        <ul className="tt-plan">
          {items.map((item) => (
            <li key={item.id} className={`tt-plan-item${item.done ? ' is-done' : ''}`}>
              <button
                type="button"
                className="tt-plan-toggle"
                aria-pressed={item.done}
                onClick={() =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))
                }
              >
                <span className="tt-plan-box" aria-hidden="true">
                  {item.done && (
                    <svg viewBox="0 0 16 16" width="16" height="16">
                      <path d="M3 8.6 6.4 12 13.4 3.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="tt-plan-text hand">{item.text}</span>
              </button>
              <button
                type="button"
                className="tt-plan-x"
                aria-label={`"${item.text}" maddesini sil`}
                onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>

        <form
          className="tt-plan-add"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Plana madde ekle
          </label>
          <input
            id={inputId}
            className="hand"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setDraft('')}
            placeholder="+ bir şey ekle…"
            maxLength={40}
            autoComplete="off"
          />
          {draft.trim() && (
            <button type="submit" className="tt-plan-addbtn" aria-label="Ekle">
              <Plus size={15} />
            </button>
          )}
        </form>

        {items.length > 0 && (
          <span className="tt-note-count hand" aria-label={`${items.length} maddeden ${doneCount} tamamlandı`}>
            {doneCount}/{items.length}
            {doneCount === items.length && ' ✿'}
          </span>
        )}
      </div>

      <p className="tt-cheer hand">
        <Smiley />
        <span>“Yaparsın.”</span>
      </p>
    </aside>
  );
}

export default PlanNote;
