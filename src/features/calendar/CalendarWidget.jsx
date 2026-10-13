import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp, useListMap } from '../../store/useApp';
import { DAYS, DAYS_SHORT, MONTHS, formatLong, fromKey } from '../../lib/date';
import { countLabel, dayDots, eventType, monthLabel, relativeLabel, useDayIndex, useMonthNav } from './calendarShared';
import './CalendarWidget.css';

const MAX_ITEMS = 3;

function CalendarWidget() {
  const { today, todos, events, setView } = useApp();
  const listMap = useListMap();
  const index = useDayIndex(todos, events);
  const { selected, select, cursor, shiftMonth, grid, focusKey, gridRef, onGridKeyDown } = useMonthNav(today);

  const day = index[selected];
  const items = [
    ...(day?.events || []).map((e) => ({ kind: 'event', id: e.id, data: e })),
    ...(day?.todos || []).map((t) => ({ kind: 'todo', id: t.id, data: t })),
  ];
  const shown = items.slice(0, MAX_ITEMS);
  const more = items.length - shown.length;
  const sel = fromKey(selected);

  return (
    <section className="card cw" aria-labelledby="cw-title">
      <header className="card-head cw-head">
        <h2 className="card-title" id="cw-title">
          <CalendarDays size={21} aria-hidden="true" /> Takvim
        </h2>
      </header>

      <div className="cw-bar">
        <button
          type="button"
          className="cw-month"
          onClick={() => setView('calendar')}
          aria-label={`${monthLabel(cursor.y, cursor.m)} — takvim sayfasını aç`}
        >
          <span>{monthLabel(cursor.y, cursor.m)}</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <div className="cw-nav">
          <button type="button" className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Önceki ay">
            <ChevronLeft size={19} />
          </button>
          <button type="button" className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Sonraki ay">
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      <div className="cw-grid" role="grid" aria-labelledby="cw-title">
        <div className="cw-row cw-week" role="row">
          {DAYS_SHORT.map((d) => (
            <span key={d} role="columnheader" className="cw-wd">
              {d}
            </span>
          ))}
        </div>
        <div className="cw-days" ref={gridRef} onKeyDown={onGridKeyDown}>
          {Array.from({ length: grid.length / 7 }, (_, row) => (
            <div className="cw-row" role="row" key={row}>
              {grid.slice(row * 7, row * 7 + 7).map((key, col) => {
                const d = fromKey(key);
                const info = index[key];
                const dots = dayDots(info, listMap);
                const count = countLabel(info);
                const outside = d.getMonth() !== cursor.m;
                return (
                  <div role="gridcell" key={key} className="cw-cell">
                    <button
                      type="button"
                      data-key={key}
                      data-col={col}
                      data-tip={count || undefined}
                      className="cw-day"
                      data-outside={outside || undefined}
                      data-today={key === today || undefined}
                      aria-pressed={key === selected}
                      aria-current={key === today ? 'date' : undefined}
                      aria-label={`${formatLong(key)}${count ? `, ${count}` : ''}`}
                      tabIndex={key === focusKey ? 0 : -1}
                      onClick={() => select(key)}
                    >
                      <span className="cw-num">{d.getDate()}</span>
                      <span className="cw-dots" aria-hidden="true">
                        {dots.map((c, i) => (
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

      <div className="cw-agenda" aria-live="polite">
        <div className="cw-agenda-head">
          <strong>
            {sel.getDate()} {MONTHS[sel.getMonth()]}, {DAYS[sel.getDay()]}
          </strong>
          <span className="cw-rel">{relativeLabel(today, selected)}</span>
        </div>
        {shown.length === 0 ? (
          <p className="cw-empty hand">Bu gün bomboş, nefes al ♡</p>
        ) : (
          <ul className="cw-items">
            {shown.map(({ kind, id, data }) => {
              if (kind === 'event') {
                const type = eventType(data.type);
                return (
                  <li key={id} className="cw-item" data-color={type.color}>
                    <span className="cw-item-icon" aria-hidden="true">
                      <type.Icon size={13} />
                    </span>
                    <span className="cw-item-text">{data.title}</span>
                    <span className="cw-item-meta">{type.label}</span>
                  </li>
                );
              }
              const list = listMap[data.listId];
              return (
                <li key={id} className="cw-item" data-color={list?.color || 'blue'} data-done={data.completed || undefined}>
                  <span className="cw-item-dot" aria-hidden="true" />
                  <span className="cw-item-text">
                    {data.text}
                    {data.completed && <span className="sr-only"> (tamamlandı)</span>}
                  </span>
                  {data.time && <span className="cw-item-meta">{data.time}</span>}
                </li>
              );
            })}
          </ul>
        )}
        {more > 0 && (
          <button type="button" className="cw-more" onClick={() => setView('calendar')}>
            +{more} daha
          </button>
        )}
      </div>
    </section>
  );
}

export default CalendarWidget;
