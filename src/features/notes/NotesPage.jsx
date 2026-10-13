import { useCallback, useMemo, useState } from 'react';
import { Pin, Plus, Search, Sparkles, StickyNote as StickyIcon, X } from 'lucide-react';
import { useApp } from '../../store/useApp';
import StickyNote from './StickyNote';
import NoteEditor from './NoteEditor';
import { NOTE_COLORS, randomPrompt, sortNotes } from './noteUtils';
import './NotesPage.css';

const norm = (s = '') => s.toLocaleLowerCase('tr');

function NotesPage() {
  const { notes, addNote, updateNote } = useApp();
  const [query, setQuery] = useState('');
  const [color, setColor] = useState('all');
  const [editing, setEditing] = useState(null);
  const closeEditor = useCallback(() => setEditing(null), []);

  const sorted = useMemo(() => sortNotes(notes), [notes]);
  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return sorted.filter(
      (n) => (color === 'all' || n.color === color) && (!q || norm(`${n.title}\n${n.body}`).includes(q))
    );
  }, [sorted, query, color]);

  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);
  const pinnedTotal = notes.filter((n) => n.pinned).length;
  const colorCounts = useMemo(
    () => notes.reduce((acc, n) => ({ ...acc, [n.color]: (acc[n.color] || 0) + 1 }), {}),
    [notes]
  );

  const openNote = useCallback((note) => setEditing({ note }), []);
  const togglePin = useCallback((note) => updateNote(note.id, { pinned: !note.pinned }), [updateNote]);

  const inspire = () => {
    const note = addNote(randomPrompt());
    setQuery('');
    setColor('all');
    setEditing({ note });
  };

  const renderGrid = (list, label) => (
    <ul className="np-grid" aria-label={label}>
      {list.map((note, i) => (
        <li key={note.id} className="np-cell" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
          <StickyNote note={note} onOpen={openNote} onTogglePin={togglePin} maxLines={14} />
        </li>
      ))}
    </ul>
  );

  const filtering = query.trim() || color !== 'all';

  return (
    <div className="np">
      <header className="page-head">
        <div>
          <h1 className="page-title">Notlar</h1>
          <p className="page-sub">
            {notes.length} not · {pinnedTotal} sabitlenmiş
            <span className="hand np-sub-hand"> — aklına geleni panoya iliştir ✎</span>
          </p>
        </div>
        <div className="np-actions">
          <button type="button" className="btn btn-soft np-inspire" onClick={inspire} title="Rastgele bir yazma önerisiyle not ekle">
            <Sparkles size={17} aria-hidden="true" />
            İlham
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setEditing({ draft: color !== 'all' ? { color } : {} })}>
            <Plus size={17} aria-hidden="true" />
            Yeni not
          </button>
        </div>
      </header>

      <div className="np-toolbar">
        <div className="np-search">
          <Search size={17} className="np-search-icon" aria-hidden="true" />
          <label htmlFor="np-q" className="sr-only">Notlarda ara</label>
          <input
            id="np-q"
            type="search"
            className="input"
            placeholder="Notlarda ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="icon-btn np-clear" onClick={() => setQuery('')} aria-label="Aramayı temizle">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="np-filter" role="group" aria-label="Renge göre filtrele">
          <button type="button" className="chip" aria-pressed={color === 'all'} onClick={() => setColor('all')}>
            Tümü
          </button>
          {NOTE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="np-swatch"
              data-color={c.id}
              aria-pressed={color === c.id}
              aria-label={`${c.label} notlar (${colorCounts[c.id] || 0})`}
              title={`${c.label} · ${colorCounts[c.id] || 0}`}
              onClick={() => setColor((cur) => (cur === c.id ? 'all' : c.id))}
            >
              {colorCounts[c.id] ? <span className="np-swatch-n" aria-hidden="true">{colorCounts[c.id]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="np-board">
        {filtered.length === 0 ? (
          <div className="np-empty">
            <StickyIcon size={34} strokeWidth={1.5} aria-hidden="true" />
            {filtering ? (
              <>
                <p className="hand">Burada bir şey bulamadım…</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setQuery('');
                    setColor('all');
                  }}
                >
                  Filtreleri temizle
                </button>
              </>
            ) : (
              <>
                <p className="hand">Pano bomboş. İlk notunu iliştir!</p>
                <button type="button" className="btn btn-soft btn-sm" onClick={inspire}>
                  <Sparkles size={15} aria-hidden="true" /> Bana bir ilham ver
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <section className="np-section" aria-labelledby="np-pinned">
                <h2 className="np-section-title" id="np-pinned">
                  <Pin size={16} aria-hidden="true" /> <span className="hand">Sabitlenenler</span>
                </h2>
                {renderGrid(pinned, 'Sabitlenmiş notlar')}
              </section>
            )}
            {others.length > 0 && (
              <section className="np-section" aria-labelledby="np-others">
                <h2 className="np-section-title" id="np-others">
                  <span className="hand">{pinned.length > 0 ? 'Diğer notlar' : 'Tüm notlar'}</span>
                </h2>
                {renderGrid(others, 'Notlar')}
              </section>
            )}
          </>
        )}
      </div>

      {editing && <NoteEditor note={editing.note} draft={editing.draft} onClose={closeEditor} />}
    </div>
  );
}

export default NotesPage;
