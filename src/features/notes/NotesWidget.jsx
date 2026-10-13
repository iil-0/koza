import { useCallback, useMemo, useState } from 'react';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import { useApp } from '../../store/useApp';
import StickyNote from './StickyNote';
import NoteEditor from './NoteEditor';
import { sortNotes } from './noteUtils';
import './NotesWidget.css';

function NotesWidget() {
  const { notes, setView } = useApp();
  const [editing, setEditing] = useState(null); // { note } | { draft }
  const closeEditor = useCallback(() => setEditing(null), []);

  const latest = useMemo(() => sortNotes(notes).slice(0, 3), [notes]);

  return (
    <section className="card nw" aria-labelledby="nw-title">
      <header className="card-head nw-head">
        <h2 className="card-title" id="nw-title">
          <FileText size={22} strokeWidth={1.8} aria-hidden="true" />
          Notlar
          {notes.length > 0 && <span className="nw-count">{notes.length}</span>}
        </h2>
        <div className="nw-actions">
          <button type="button" className="nw-all" onClick={() => setView('notes')}>
            Tümünü gör
            <ArrowRight size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn nw-add"
            onClick={() => setEditing({ draft: {} })}
            aria-label="Yeni not ekle"
            title="Yeni not"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {latest.length > 0 ? (
        <ul className="nw-row scroll-thin" aria-label="Son notlar">
          {latest.map((note) => (
            <li key={note.id} className="nw-item">
              <StickyNote note={note} size="sm" maxLines={4} onOpen={(n) => setEditing({ note: n })} />
            </li>
          ))}
        </ul>
      ) : (
        <button type="button" className="nw-empty" onClick={() => setEditing({ draft: {} })}>
          <span className="hand">Henüz not yok…</span>
          <span className="faint">İlk notunu yapıştırmak için dokun ✎</span>
        </button>
      )}

      {editing && <NoteEditor note={editing.note} draft={editing.draft} onClose={closeEditor} />}
    </section>
  );
}

export default NotesWidget;
