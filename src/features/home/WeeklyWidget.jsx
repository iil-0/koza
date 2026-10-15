import { useMemo } from 'react';
import { BarChart3, Timer } from 'lucide-react';
import { useApp } from '../../store/useApp';
import { DAYS, DAYS_SHORT, fromKey, MONTHS, toKey, weekKeys } from '../../lib/date';
import './WeeklyWidget.css';

function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} dk`;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

function rangeLabel(keys) {
  const a = fromKey(keys[0]);
  const b = fromKey(keys[6]);
  const short = (d) => MONTHS[d.getMonth()].slice(0, 3);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${short(b)}`
    : `${a.getDate()} ${short(a)} – ${b.getDate()} ${short(b)}`;
}

function WeeklyWidget() {
  const { todos, today, focusLog } = useApp();

  const data = useMemo(() => {
    const keys = weekKeys(today);
    const inWeek = new Set(keys);
    const planned = todos.filter((t) => inWeek.has(t.date) && (!t.archived || t.completed));
    const done = planned.filter((t) => t.completed).length;

    // completed per day (by completion day, falling back to due date)
    const perDay = Object.fromEntries(keys.map((k) => [k, 0]));
    todos.forEach((t) => {
      if (!t.completed) return;
      const k = t.completedAt ? toKey(new Date(t.completedAt)) : t.date;
      if (k in perDay) perDay[k] += 1;
    });
    const days = keys.map((k, i) => ({ key: k, label: DAYS_SHORT[i], count: perDay[k] }));
    const max = Math.max(1, ...days.map((d) => d.count));
    const focus = keys.reduce((s, k) => s + (focusLog?.[k]?.minutes || 0), 0);

    return { keys, total: planned.length, done, days, max, focus };
  }, [todos, today, focusLog]);

  const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;

  return (
    <section className="card wk" aria-labelledby="wk-title">
      <header className="card-head wk-head">
        <h2 className="card-title" id="wk-title">
          <BarChart3 size={22} strokeWidth={2} className="wk-icon" aria-hidden="true" />
          Bu Hafta
        </h2>
        <span className="wk-range">{rangeLabel(data.keys)}</span>
      </header>

      <div className="wk-body">
        <div className="wk-main">
          <p className="wk-summary">
            <strong>
              {data.done}/{data.total}
            </strong>{' '}
            görev tamamlandı
          </p>

          <div className="wk-progress">
            <div
              className="wk-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Haftalık görev ilerlemesi"
            >
              <span style={{ width: `${pct}%` }} />
            </div>
            <span className="wk-pct">%{pct}</span>
          </div>

          <ul className="wk-chart" aria-label="Günlere göre tamamlanan görevler">
            {data.days.map((d, i) => {
              const isToday = d.key === today;
              const isFuture = d.key > today;
              const label = `${DAYS[(i + 1) % 7]}: ${d.count} görev tamamlandı`;
              return (
                <li
                  key={d.key}
                  className={`wk-col ${isToday ? 'is-today' : ''} ${isFuture ? 'is-future' : ''}`}
                  title={label}
                >
                  <span className="sr-only">{label}</span>
                  <span className="wk-col-val" aria-hidden="true">
                    {d.count > 0 ? d.count : ''}
                  </span>
                  <span className="wk-col-track" aria-hidden="true">
                    <span
                      className="wk-col-bar"
                      style={{ height: d.count ? `${Math.max(14, (d.count / data.max) * 100)}%` : undefined }}
                    />
                  </span>
                  <span className="wk-col-label" aria-hidden="true">
                    {d.label}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="wk-focus">
            <Timer size={15} aria-hidden="true" />
            {data.focus > 0 ? (
              <>
                <strong>{formatMinutes(data.focus)}</strong> odak
              </>
            ) : (
              <span>Bu hafta henüz odak seansı yok</span>
            )}
          </p>
        </div>

        <blockquote className="wk-quote hand">
          İstikrarlı olmak mükemmel olmaktan daha önemli.
          <span className="wk-heart" aria-hidden="true">
            ♡
          </span>
        </blockquote>
      </div>
    </section>
  );
}

export default WeeklyWidget;
