import { useEffect, useId, useRef, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, ListPlus, Trash2 } from 'lucide-react';
import { useApp, useListMap } from '../../store/useApp';
import { DAYS, DAYS_SHORT, MONTHS, formatLong, fromKey } from '../../lib/date';
import Modal from '../../components/Modal';
import {
  EVENT_TYPES,
  EVENT_TYPE_KEYS,
  countLabel,
  dayDots,
  eventType,
  monthLabel,
  relativeLabel,
  useDayIndex,
  useMonthNav,
} from './calendarShared';
import './CalendarPage.css';

const CELL_MAX = 3;

/* ---------------- month grid ---------------- */

function MonthGrid({ nav, index, listMap, today }) {
  const { grid, cursor, selected, select, focusKey, gridRef, onGridKeyDown } = nav;
  const rows = grid.length / 7;

  return (
    <div className="cp-grid" role="grid" aria-label={monthLabel(cursor.y, cursor.m)}>
      <div className="cp-row cp-week" role="row">
        {DAYS_SHORT.map((d, i) => (
          <span key={d} role="columnheader" className="cp-wd" data-weekend={i > 4 || undefined}>
            <abbr title={DAYS[(i + 1) % 7]}>{d}</abbr>
          </span>
        ))}
      </div>
      <div className="cp-days" ref={gridRef} onKeyDown={onGridKeyDown} style={{ '--rows': rows }}>
        {Array.from({ length: rows }, (_, r) => (
          <div className="cp-row" role="row" key={r}>
            {grid.slice(r * 7, r * 7 + 7).map((key) => {
              const d = fromKey(key);
              const info = index[key];
              const items = [
                ...(info?.events || []).map((e) => ({ kind: 'event', data: e })),
                ...(info?.todos || []).map((t) => ({ kind: 'todo', data: t })),
              ];
              const shown = items.slice(0, CELL_MAX);
              const more = items.length - shown.length;
              const count = countLabel(info);
              return (
                <div role="gridcell" key={key} className="cp-cell-wrap">
                  <button
                    type="button"
                    className="cp-cell"
                    data-key={key}
                    data-outside={d.getMonth() !== cursor.m || undefined}
                    data-today={key === today || undefined}
                    data-past={key < today || undefined}
                    aria-pressed={key === selected}
                    aria-current={key === today ? 'date' : undefined}
                    aria-label={`${formatLong(key)}${count ? `, ${count}` : ''}`}
                    tabIndex={key === focusKey ? 0 : -1}
                    onClick={() => select(key)}
                  >
                    <span className="cp-num">{d.getDate()}</span>
                    <span className="cp-items" aria-hidden="true">
                      {shown.map(({ kind, data }) => {
                        if (kind === 'event') {
                          const t = eventType(data.type);
                          return (
                            <span key={data.id} className="cp-chip cp-chip--event" data-color={t.color}>
                              <t.Icon size={11} />
                              <span>{data.title}</span>
                            </span>
                          );
                        }
                        return (
                          <span
                            key={data.id}
                            className="cp-chip"
                            data-color={listMap[data.listId]?.color || 'blue'}
                            data-done={data.completed || undefined}
                          >
                            <span>{data.text}</span>
                          </span>
                        );
                      })}
                      {more > 0 && <span className="cp-more">+{more}</span>}
                    </span>
                    <span className="cp-dots" aria-hidden="true">
                      {dayDots(info, listMap, 4).map((c, i) => (
                        <i key={i} data-color={c} />
                      ))}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- side panel ---------------- */

function AddTodoForm({ date, onDone }) {
  const { addTodo, lists } = useApp();
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [listId, setListId] = useState(lists[0]?.id || 'kisisel');
  const inputRef = useRef(null);
  const uid = useId();

  useEffect(() => inputRef.current?.focus(), []);

  const submit = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    addTodo({ text: clean, time, listId, date });
    setText('');
    setTime('');
    inputRef.current?.focus();
  };

  return (
    <form className="cp-form" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onDone()}>
      <label className="sr-only" htmlFor={`${uid}-t`}>
        Görev
      </label>
      <input
        id={`${uid}-t`}
        ref={inputRef}
        className="input"
        placeholder="Ne yapacaksın?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={140}
      />
      <div className="cp-form-row">
        <label className="field">
          <span className="field-label">Saat</span>
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Liste</span>
          <select className="select" value={listId} onChange={(e) => setListId(e.target.value)}>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="cp-form-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
          Kapat
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>
          Ekle
        </button>
      </div>
    </form>
  );
}

function EventModal({ open, onClose, defaultDate }) {
  const { addEvent } = useApp();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Etkinlik ekle"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" form="cp-event-form" className="btn btn-primary">
            Kaydet
          </button>
        </>
      }
    >
      <EventForm
        defaultDate={defaultDate}
        onSubmit={(data) => {
          addEvent(data);
          onClose();
        }}
      />
    </Modal>
  );
}

function EventForm({ defaultDate, onSubmit }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState('exam');

  return (
    <form
      id="cp-event-form"
      className="cp-event-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !date) return;
        onSubmit({ title: title.trim(), date, type });
      }}
    >
      <label className="field">
        <span className="field-label">Başlık</span>
        <input
          className="input"
          required
          maxLength={120}
          placeholder="Örn. Veri Yapıları vize"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="field-label">Tarih</span>
        <input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <fieldset className="cp-types">
        <legend className="field-label">Tür</legend>
        <div className="cp-type-list">
          {EVENT_TYPE_KEYS.map((k) => {
            const t = EVENT_TYPES[k];
            return (
              <label key={k} className="cp-type" data-color={t.color}>
                <input type="radio" name="cp-type" value={k} checked={type === k} onChange={() => setType(k)} />
                <t.Icon size={16} aria-hidden="true" />
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}

function DayPanel({ dateKey, day, today, listMap }) {
  const { toggleTodo, deleteEvent } = useApp();
  const [adding, setAdding] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const d = fromKey(dateKey);
  const events = day?.events || [];
  const todos = day?.todos || [];
  const done = todos.filter((t) => t.completed).length;

  return (
    <aside className="card cp-panel" aria-labelledby="cp-panel-title">
      <header className="cp-panel-head">
        <div className="cp-panel-date" data-today={dateKey === today || undefined}>
          <span className="cp-panel-day">{d.getDate()}</span>
          <span className="cp-panel-month">{MONTHS[d.getMonth()].slice(0, 3)}</span>
        </div>
        <div className="cp-panel-meta">
          <h2 id="cp-panel-title">{DAYS[d.getDay()]}</h2>
          <p>
            {formatLong(dateKey)} · <span className="cp-rel">{relativeLabel(today, dateKey)}</span>
          </p>
        </div>
      </header>

      <div className="cp-panel-actions">
        <button
          type="button"
          className="btn btn-soft btn-sm"
          onClick={() => setAdding((a) => !a)}
          aria-expanded={adding}
        >
          <ListPlus size={16} aria-hidden="true" /> Görev ekle
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEventOpen(true)}>
          <CalendarPlus size={16} aria-hidden="true" /> Etkinlik ekle
        </button>
      </div>

      {adding && <AddTodoForm key={dateKey} date={dateKey} onDone={() => setAdding(false)} />}

      {events.length > 0 && (
        <section className="cp-sec" aria-label="Etkinlikler">
          <h3 className="cp-sec-title">Etkinlikler</h3>
          <ul className="cp-list">
            {events.map((e) => {
              const t = eventType(e.type);
              return (
                <li key={e.id} className="cp-event" data-color={t.color}>
                  <span className="cp-event-icon" aria-hidden="true">
                    <t.Icon size={16} />
                  </span>
                  <span className="cp-event-text">
                    <strong>{e.title}</strong>
                    <small>{t.label}</small>
                  </span>
                  <button
                    type="button"
                    className="icon-btn cp-del"
                    onClick={() => deleteEvent(e.id)}
                    aria-label={`${e.title} etkinliğini sil`}
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {todos.length > 0 && (
        <section className="cp-sec" aria-label="Görevler">
          <h3 className="cp-sec-title">
            Görevler <span>{done}/{todos.length}</span>
          </h3>
          <ul className="cp-list">
            {todos.map((t) => {
              const list = listMap[t.listId];
              return (
                <li key={t.id} className="cp-todo" data-done={t.completed || undefined}>
                  <label className="cp-todo-label">
                    <input type="checkbox" className="check" checked={t.completed} onChange={() => toggleTodo(t.id)} />
                    <span className="cp-todo-text">{t.text}</span>
                  </label>
                  {t.time && (
                    <span className="cp-todo-time">
                      <Clock size={12} aria-hidden="true" />
                      {t.time}
                    </span>
                  )}
                  {list && (
                    <span className="tag" data-color={list.color}>
                      {list.name}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {events.length === 0 && todos.length === 0 && !adding && (
        <div className="empty cp-empty">
          <span className="hand">Bu gün bomboş — kendine bir mola ver ♡</span>
          <span>Yukarıdan görev ya da etkinlik ekleyebilirsin.</span>
        </div>
      )}

      <EventModal open={eventOpen} onClose={() => setEventOpen(false)} defaultDate={dateKey} />
    </aside>
  );
}

/* ---------------- page ---------------- */

function CalendarPage() {
  const { today, todos, events } = useApp();
  const listMap = useListMap();
  const index = useDayIndex(todos, events);
  const nav = useMonthNav(today);
  const { cursor, shiftMonth, select, selected } = nav;

  const monthPrefix = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;
  const monthEvents = events.filter((e) => e.date.startsWith(monthPrefix)).length;
  const monthTodos = todos.filter((t) => !t.archived && t.date?.startsWith(monthPrefix)).length;

  return (
    <div className="cp">
      <header className="page-head">
        <div>
          <h1 className="page-title">Takvim</h1>
          <p className="page-sub">
            Bu ay <strong>{monthTodos}</strong> görev ve <strong>{monthEvents}</strong> etkinlik seni bekliyor.
          </p>
        </div>
        <div className="cp-controls">
          <button type="button" className="icon-btn cp-arrow" onClick={() => shiftMonth(-1)} aria-label="Önceki ay">
            <ChevronLeft size={20} />
          </button>
          <h2 className="cp-month" aria-live="polite">
            {MONTHS[cursor.m]} <span>{cursor.y}</span>
          </h2>
          <button type="button" className="icon-btn cp-arrow" onClick={() => shiftMonth(1)} aria-label="Sonraki ay">
            <ChevronRight size={20} />
          </button>
          <button type="button" className="btn btn-soft btn-sm cp-today-btn" onClick={() => select(today)}>
            Bugün
          </button>
        </div>
      </header>

      <div className="cp-layout">
        <section className="card cp-month-card" aria-label="Aylık görünüm">
          <MonthGrid nav={nav} index={index} listMap={listMap} today={today} />
          <ul className="cp-legend" aria-label="Etkinlik türleri">
            {EVENT_TYPE_KEYS.map((k) => {
              const t = EVENT_TYPES[k];
              return (
                <li key={k} data-color={t.color}>
                  <t.Icon size={13} aria-hidden="true" /> {t.label}
                </li>
              );
            })}
            <li className="cp-legend-hint hand">ok tuşlarıyla günler arasında gezinebilirsin</li>
          </ul>
        </section>

        <DayPanel dateKey={selected} day={index[selected]} today={today} listMap={listMap} />
      </div>
    </div>
  );
}

export default CalendarPage;
