import { Pin, PinOff } from 'lucide-react';
import { NOTE_DOODLES, hashString } from './noteUtils';
import './StickyNote.css';

/**
 * Paper sticky note. Clicking the paper calls onOpen(note).
 * Optional onTogglePin renders a small pin button in the corner.
 * size: 'sm' (dashboard) | 'md' (board)
 */
function StickyNote({ note, onOpen, onTogglePin, size = 'md', maxLines, className = '', style }) {
  const h = hashString(note.id);
  const rotation = ((h % 70) / 10 - 3.5).toFixed(1); // -3.5deg .. +3.4deg
  const tapeTilt = (((h >> 8) % 14) - 7).toString(); // -7 .. +6
  const Doodle = NOTE_DOODLES[note.color] || NOTE_DOODLES.yellow;
  const allLines = (note.body || '').split('\n');
  const truncated = maxLines && allLines.length > maxLines;
  const lines = truncated
    ? [...allLines.slice(0, maxLines - 1), `${allLines[maxLines - 1].replace(/\s+$/, '')} …`]
    : allLines;
  const title = note.title?.trim() || 'Başlıksız not';

  return (
    <article
      className={`sticky sticky--${size} ${note.pinned ? 'is-pinned' : ''} ${className}`}
      data-color={note.color}
      style={{ '--rot': `${rotation}deg`, '--tape-rot': `${tapeTilt}deg`, ...style }}
    >
      {note.pinned ? (
        <span className="sticky-pin" aria-hidden="true" />
      ) : (
        <span className="sticky-tape" aria-hidden="true" />
      )}

      <button
        type="button"
        className="sticky-hit"
        onClick={() => onOpen?.(note)}
        aria-label={`${title} notunu düzenle${note.pinned ? ' (sabitlenmiş)' : ''}`}
      >
        <span className="sticky-title">{title}</span>
        <span
          className={`sticky-body ${maxLines ? 'is-clamped' : ''}`}
          style={maxLines ? { '--lines': maxLines } : undefined}
        >
          {lines.map((line, i) => {
            const isItem = /^\s*[-•*]\s/.test(line);
            return (
              <span key={i} className={`sticky-line ${isItem ? 'is-item' : ''}`}>
                {isItem ? line.replace(/^\s*[-•*]\s/, '') : line || ' '}
              </span>
            );
          })}
        </span>
      </button>

      <Doodle className="sticky-doodle" size={size === 'sm' ? 18 : 20} strokeWidth={1.6} aria-hidden="true" />

      {onTogglePin && (
        <button
          type="button"
          className="sticky-pin-btn"
          onClick={() => onTogglePin(note)}
          aria-label={note.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
          aria-pressed={note.pinned}
          title={note.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
        >
          {note.pinned ? <PinOff size={15} /> : <Pin size={15} />}
        </button>
      )}
    </article>
  );
}

export default StickyNote;
