import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { addDays, DAYS_SHORT, fromKey, MONTHS, weekKeys } from '../../lib/date';
import { bestStreak, level, ratioOn } from './habitUtils';
import './HabitsPage.css';

const WEEKS = 12;

/** GitHub-style contribution heatmap for the last 12 weeks */
function HabitHeatmap({ habits, today }) {
  const [picked, setSelected] = useState('all');
  const habit = habits.find((h) => h.id === picked);
  const selected = habit ? picked : 'all'; // falls back if the habit was deleted
  const active = useMemo(() => (habit ? [habit] : habits), [habit, habits]);

  const { columns, months, stats } = useMemo(() => {
    const start = addDays(weekKeys(today)[0], -7 * (WEEKS - 1));
    const cols = Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const key = addDays(start, w * 7 + d);
        const future = key > today;
        const ratio =
          future || !active.length ? 0 : active.reduce((sum, h) => sum + ratioOn(h, key), 0) / active.length;
        return { key, future, ratio, lvl: level(ratio) };
      })
    );

    // month label on the column whose week contains the 1st of a month
    const labels = cols.map((col, w) => {
      const first = col.find((c) => fromKey(c.key).getDate() === 1);
      if (first) return MONTHS[fromKey(first.key).getMonth()].slice(0, 3);
      if (w === 0 && !cols[1]?.some((c) => fromKey(c.key).getDate() === 1)) {
        return MONTHS[fromKey(col[0].key).getMonth()].slice(0, 3);
      }
      return '';
    });

    const past = cols.flat().filter((c) => !c.future);
    const perfect = past.filter((c) => c.ratio >= 1).length;
    const avg = past.length ? Math.round((past.reduce((s, c) => s + c.ratio, 0) / past.length) * 100) : 0;
    const best = active.reduce((m, h) => Math.max(m, bestStreak(h, today)), 0);
    return { columns: cols, months: labels, stats: { perfect, avg, best } };
  }, [active, today]);

  const name = habit ? habit.name : 'Tüm alışkanlıklar';
  const unitFor = (c) => {
    const d = fromKey(c.key);
    const date = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    if (habit) {
      const n = Math.min(habit.log?.[c.key] || 0, habit.target);
      return `${date}: ${n}/${habit.target} ${habit.unit || ''}`.trim();
    }
    return `${date}: %${Math.round(c.ratio * 100)}`;
  };

  return (
    <section className="card hb-heat-card" aria-labelledby="hb-heat-title" data-color={habit?.color}>
      <header className="card-head hb-heat-head">
        <h2 className="card-title" id="hb-heat-title">
          <CalendarDays size={20} aria-hidden="true" />
          Son 12 hafta
        </h2>
        <div className="hb-heat-tabs" role="group" aria-label="Alışkanlık seç">
          <button type="button" className="chip" aria-pressed={selected === 'all'} onClick={() => setSelected('all')}>
            Tümü
          </button>
          {habits.map((h) => (
            <button
              key={h.id}
              type="button"
              className="chip hb-heat-chip"
              data-color={h.color}
              aria-pressed={selected === h.id}
              onClick={() => setSelected(h.id)}
            >
              <span className="dot" aria-hidden="true" />
              {h.name}
            </button>
          ))}
        </div>
      </header>

      <div className="hb-heat-body">
        <div
          className="hb-heat"
          role="group"
          aria-label={`${name} için son ${WEEKS} haftalık ısı haritası`}
          style={{ '--weeks': WEEKS }}
        >
          {months.map((m, w) => (
            <span key={`m${w}`} className="hb-heat-month" style={{ gridColumn: w + 2, gridRow: 1 }} aria-hidden="true">
              {m}
            </span>
          ))}
          {DAYS_SHORT.map((d, i) => (
            <span key={d} className="hb-heat-wd" style={{ gridColumn: 1, gridRow: i + 2 }} aria-hidden="true">
              {i % 2 === 0 ? d : ''}
            </span>
          ))}
          {columns.map((col, w) =>
            col.map((c, d) =>
              c.future ? (
                <span key={c.key} className="hb-cell is-future" style={{ gridColumn: w + 2, gridRow: d + 2 }} aria-hidden="true" />
              ) : (
                <span
                  key={c.key}
                  className={`hb-cell lvl-${c.lvl} ${c.key === today ? 'is-today' : ''}`}
                  style={{ gridColumn: w + 2, gridRow: d + 2 }}
                  role="img"
                  aria-label={unitFor(c)}
                  title={unitFor(c)}
                />
              )
            )
          )}
        </div>

        <aside className="hb-heat-stats">
          <div className="hb-stat">
            <strong>{stats.perfect}</strong>
            <span>tam gün</span>
          </div>
          <div className="hb-stat">
            <strong>{stats.best}</strong>
            <span>en uzun seri</span>
          </div>
          <div className="hb-stat">
            <strong>%{stats.avg}</strong>
            <span>ortalama</span>
          </div>
          <div className="hb-legend" aria-hidden="true">
            <span>az</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className={`hb-cell lvl-${l}`} />
            ))}
            <span>çok</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default HabitHeatmap;
