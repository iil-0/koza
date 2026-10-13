import { useEffect, useRef, useState } from 'react';
import { Bell, MoreHorizontal, Trash2 } from 'lucide-react';
import { useApp } from '../../store/useApp';
import { MONTHS, diffDays, formatLong, fromKey } from '../../lib/date';
import { eventType, relativeLabel } from './calendarShared';
import './UpcomingWidget.css';

const LIMIT = 3;

function RowMenu({ title, onDelete }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    wrapRef.current?.querySelector('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="up-menu-wrap" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="icon-btn up-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${title} için seçenekler`}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="up-menu" role="menu" aria-label={`${title} seçenekleri`}>
          <button
            type="button"
            role="menuitem"
            className="up-menu-item"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            onBlur={(e) => {
              if (!wrapRef.current?.contains(e.relatedTarget)) setOpen(false);
            }}
          >
            <Trash2 size={15} aria-hidden="true" /> Sil
          </button>
        </div>
      )}
    </div>
  );
}

function UpcomingWidget() {
  const { events, today, deleteEvent, setView } = useApp();
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'tr'));
  const shown = upcoming.slice(0, LIMIT);
  const rest = upcoming.length - shown.length;

  return (
    <section className="card up" aria-labelledby="up-title">
      <header className="card-head">
        <h2 className="card-title" id="up-title">
          <Bell size={20} aria-hidden="true" /> Yaklaşanlar
        </h2>
        <button type="button" className="up-all" onClick={() => setView('calendar')}>
          Tümünü Gör
        </button>
      </header>

      {shown.length === 0 ? (
        <div className="empty up-empty">
          <span className="hand">Ufukta bir şey yok, keyfine bak ☕</span>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setView('calendar')}>
            Etkinlik ekle
          </button>
        </div>
      ) : (
        <ul className="up-list">
          {shown.map((e) => {
            const type = eventType(e.type);
            const d = fromKey(e.date);
            const diff = diffDays(today, e.date);
            return (
              <li key={e.id} className="up-row" data-color={type.color}>
                <span className="up-tile" aria-hidden="true">
                  <span className="up-tile-month">{MONTHS[d.getMonth()].slice(0, 3)}</span>
                  <span className="up-tile-day">{d.getDate()}</span>
                </span>
                <div className="up-info">
                  <p className="up-title">{e.title}</p>
                  <p className="up-date">
                    <type.Icon size={12} aria-hidden="true" />
                    <span className="sr-only">{type.label}, </span>
                    {formatLong(e.date)}
                  </p>
                </div>
                <span className="up-chip" data-soon={diff <= 3 || undefined}>
                  {relativeLabel(today, e.date)}
                </span>
                <RowMenu title={e.title} onDelete={() => deleteEvent(e.id)} />
              </li>
            );
          })}
        </ul>
      )}

      {rest > 0 && (
        <button type="button" className="up-rest" onClick={() => setView('calendar')}>
          +{rest} etkinlik daha
        </button>
      )}
    </section>
  );
}

export default UpcomingWidget;
