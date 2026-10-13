import { useState } from 'react';
import { Check, Pin, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { useApp } from '../../store/useApp';
import { NOTE_COLORS } from './noteUtils';
import './NoteEditor.css';

/**
 * Create / edit a note. Mount it only while open:
 *   {editing && <NoteEditor note={editing.note} draft={editing.draft} onClose={...} />}
 * - note: an existing note (edit mode)
 * - draft: defaults for a new, not-yet-saved note
 */
function NoteEditor({ note, draft, onClose }) {
  const { addNote, updateNote, deleteNote } = useApp();
  const base = note || { title: '', body: '', color: 'yellow', pinned: false, ...draft };
  const [title, setTitle] = useState(base.title);
  const [body, setBody] = useState(base.body);
  const [color, setColor] = useState(base.color);
  const [pinned, setPinned] = useState(base.pinned);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEmpty = !title.trim() && !body.trim();

  const save = () => {
    if (note) {
      if (isEmpty) deleteNote(note.id);
      else updateNote(note.id, { title: title.trim(), body, color, pinned });
    } else if (!isEmpty) {
      addNote({ title: title.trim(), body, color, pinned });
    }
    onClose();
  };

  const remove = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteNote(note.id);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    }
  };

  return (
    <Modal
      open
      title={note ? 'Notu düzenle' : 'Yeni not'}
      onClose={onClose}
      width={500}
      footer={
        <div className="ne-foot">
          {note && (
            <button
              type="button"
              className={`btn btn-sm ne-delete ${confirmDelete ? 'is-confirm' : ''}`}
              onClick={remove}
              onBlur={() => setConfirmDelete(false)}
            >
              <Trash2 size={15} />
              {confirmDelete ? 'Emin misin?' : 'Sil'}
            </button>
          )}
          <span className="ne-spacer" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Vazgeç
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!note && isEmpty}>
            <Check size={15} />
            {note ? 'Kaydet' : 'Ekle'}
          </button>
        </div>
      }
    >
      <div className="ne-paper" data-color={color} onKeyDown={onKeyDown}>
        <label className="sr-only" htmlFor="ne-title">Başlık</label>
        <input
          id="ne-title"
          className="ne-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Başlık…"
          maxLength={80}
          autoComplete="off"
        />
        <label className="sr-only" htmlFor="ne-body">Not</label>
        <textarea
          id="ne-body"
          className="ne-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={'Aklından geçenleri yaz…\n- madde için tire kullan'}
          rows={7}
        />
      </div>

      <div className="ne-row">
        <div className="ne-swatches" role="radiogroup" aria-label="Not rengi">
          {NOTE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={color === c.id}
              aria-label={c.label}
              title={c.label}
              data-color={c.id}
              className="ne-swatch"
              onClick={() => setColor(c.id)}
            />
          ))}
        </div>

        <button
          type="button"
          className="chip ne-pin"
          aria-pressed={pinned}
          onClick={() => setPinned((p) => !p)}
        >
          <Pin size={15} />
          {pinned ? 'Sabitlendi' : 'Sabitle'}
        </button>
      </div>
      <p className="ne-hint faint">İpucu: Ctrl + Enter ile kaydet</p>
    </Modal>
  );
}

export default NoteEditor;
