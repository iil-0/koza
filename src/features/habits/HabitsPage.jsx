import { useCallback, useMemo, useState } from 'react';
import { Flame, Plus, Sprout } from 'lucide-react';
import { useApp } from '../../store/useApp';
import { formatWithDay } from '../../lib/date';
import HabitCard from './HabitCard';
import HabitHeatmap from './HabitHeatmap';
import HabitEditor from './HabitEditor';
import { countOn, currentStreak, doneOn } from './habitUtils';
import './HabitsPage.css';

const R = 34;
const C = 2 * Math.PI * R;

function message(done, total, pct) {
  if (!total) return 'İlk alışkanlığını ekleyerek başla ♡';
  if (done === total) return 'Bugün hepsini tamamladın, harikasın! ✦';
  if (pct >= 50) return 'Yarıyı geçtin, güzel gidiyor ♡';
  if (pct > 0) return 'Küçük adımlar da sayılır, devam!';
  return 'Küçük bir adımla başla ♡';
}

function HabitsPage() {
  const { habits, today } = useApp();
  const [editing, setEditing] = useState(null); // { habit } | {}
  const closeEditor = useCallback(() => setEditing(null), []);
  const openEditor = useCallback((habit) => setEditing({ habit }), []);

  const summary = useMemo(() => {
    const total = habits.length;
    const done = habits.filter((h) => doneOn(h, today)).length;
    const units = habits.reduce((s, h) => s + Math.min(countOn(h, today), h.target), 0);
    const targets = habits.reduce((s, h) => s + h.target, 0);
    const pct = targets ? Math.round((units / targets) * 100) : 0;
    const top = habits.reduce(
      (best, h) => {
        const s = currentStreak(h, today);
        return s > best.streak ? { name: h.name, streak: s } : best;
      },
      { name: '', streak: 0 }
    );
    return { total, done, pct, top };
  }, [habits, today]);

  return (
    <div className="hb">
      <header className="page-head">
        <div>
          <h1 className="page-title">Alışkanlıklar</h1>
          <p className="page-sub">{formatWithDay(today)}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={17} aria-hidden="true" />
          Yeni alışkanlık
        </button>
      </header>

      <section className="card hb-summary" aria-label="Bugünün özeti">
        <div className="hb-summary-ring" role="img" aria-label={`Bugünkü ilerleme yüzde ${summary.pct}`}>
          <svg viewBox="0 0 80 80" width="88" height="88" aria-hidden="true">
            <circle className="hb-sum-track" cx="40" cy="40" r={R} />
            <circle
              className="hb-sum-fill"
              cx="40"
              cy="40"
              r={R}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - summary.pct / 100)}
            />
          </svg>
          <span className="hb-summary-pct">%{summary.pct}</span>
        </div>
        <div className="hb-summary-text">
          <p className="hb-summary-big">
            Bugün <strong>{summary.done}/{summary.total}</strong> alışkanlık tamamlandı
          </p>
          <p className="hand hb-summary-hand">{message(summary.done, summary.total, summary.pct)}</p>
        </div>
        {summary.top.streak > 0 && (
          <div className="hb-summary-streak">
            <Flame size={20} aria-hidden="true" />
            <div>
              <strong>{summary.top.streak} gün</strong>
              <span>{summary.top.name} serisi</span>
            </div>
          </div>
        )}
      </section>

      {habits.length === 0 ? (
        <div className="card empty hb-empty">
          <Sprout size={36} strokeWidth={1.5} aria-hidden="true" />
          <p className="hand">Burada henüz bir şey filizlenmedi…</p>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden="true" /> İlk alışkanlığını ekle
          </button>
        </div>
      ) : (
        <>
          <div className="hb-grid">
            {habits.map((h, i) => (
              <HabitCard key={h.id} habit={h} onEdit={openEditor} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
            <button type="button" className="hb-add-tile" onClick={() => setEditing({})}>
              <Plus size={26} aria-hidden="true" />
              <span className="hand">yeni bir alışkanlık ekle</span>
            </button>
          </div>
          <HabitHeatmap habits={habits} today={today} />
        </>
      )}

      {editing && <HabitEditor habit={editing.habit} onClose={closeEditor} />}
    </div>
  );
}

export default HabitsPage;
