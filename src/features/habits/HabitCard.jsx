import { useState } from 'react';
import { Check, Flame, Minus, Pencil, Plus } from 'lucide-react';
import Icon from '../../components/Icon';
import { useApp } from '../../store/useApp';
import { DAYS_SHORT, fromKey, MONTHS, weekKeys } from '../../lib/date';
import { countOn, currentStreak, ratioOn } from './habitUtils';
import './HabitsPage.css';

const RING_R = 13;
const RING_C = 2 * Math.PI * RING_R;

/* deterministic confetti pieces: angle, distance, shape, color slot */
const PIECES = Array.from({ length: 18 }, (_, i) => ({
  a: Math.round((360 / 18) * i + ((i * 37) % 17) - 8),
  d: 54 + ((i * 29) % 46),
  s: ['dot', 'sq', 'strip'][i % 3],
  c: i % 4,
  r: (i * 53) % 360,
}));

function Confetti() {
  return (
    <span className="hb-confetti" aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={`hb-bit hb-bit--${p.s} hb-bit--c${p.c}`}
          style={{ '--a': `${p.a}deg`, '--d': `${p.d}px`, '--r': `${p.r}deg`, animationDelay: `${(i % 5) * 18}ms` }}
        />
      ))}
    </span>
  );
}

function MiniRing({ ratio, isToday, isFuture, label }) {
  return (
    <span className={`hb-day ${isToday ? 'is-today' : ''} ${isFuture ? 'is-future' : ''}`} role="img" aria-label={label} title={label}>
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <circle className="hb-ring-track" cx="16" cy="16" r={RING_R} />
        {ratio > 0 && (
          <circle
            className="hb-ring-fill"
            cx="16"
            cy="16"
            r={RING_R}
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - ratio)}
          />
        )}
        {ratio >= 1 && <circle className="hb-ring-done" cx="16" cy="16" r="8" />}
      </svg>
    </span>
  );
}

function HabitCard({ habit, onEdit, style }) {
  const { today, setHabitCount } = useApp();
  const [burst, setBurst] = useState(0);
  const count = Math.min(countOn(habit, today), habit.target);
  const done = count >= habit.target;
  const streak = currentStreak(habit, today);
  const unit = habit.unit?.trim() || 'kez';
  const week = weekKeys(today);

  const inc = () => {
    if (count >= habit.target) return;
    setHabitCount(habit.id, count + 1, today);
    if (count + 1 === habit.target) setBurst((b) => b + 1);
  };
  const dec = () => count > 0 && setHabitCount(habit.id, count - 1, today);

  const showDots = habit.target <= 12;

  return (
    <article
      className={`card hb-card ${done ? 'is-done' : ''}`}
      data-color={habit.color}
      style={style}
    >
      <header className="hb-card-head">
        <span className="hb-icon" aria-hidden="true">
          <Icon name={habit.icon} size={22} strokeWidth={1.9} />
        </span>
        <div className="hb-name-wrap">
          <h3 className="hb-name">{habit.name}</h3>
          <p className="hb-target faint">
            Günde {habit.target} {unit}
          </p>
        </div>
        <span
          className={`hb-streak ${streak > 0 ? 'is-hot' : ''}`}
          title={streak > 0 ? `${streak} günlük seri` : 'Henüz seri yok'}
        >
          <Flame size={15} aria-hidden="true" />
          <span>{streak}</span>
          <span className="sr-only"> günlük seri</span>
        </span>
        <button type="button" className="icon-btn hb-edit" onClick={() => onEdit(habit)} aria-label={`${habit.name} alışkanlığını düzenle`}>
          <Pencil size={16} />
        </button>
      </header>

      <div className="hb-today">
        <button
          type="button"
          className="hb-step"
          onClick={dec}
          aria-disabled={count === 0}
          aria-label={`${habit.name}: bir ${unit} azalt`}
        >
          <Minus size={22} />
        </button>

        <div className="hb-count" aria-live="polite">
          <span className="hb-count-num">
            <strong>{count}</strong>/{habit.target}
          </span>
          <span className="hb-count-unit">{done ? 'tamamlandı ✦' : `${unit} · bugün`}</span>
          {burst > 0 && <span key={`ring-${burst}`} className="hb-pop-ring" aria-hidden="true" />}
          {burst > 0 && <Confetti key={burst} />}
        </div>

        <button
          type="button"
          className="hb-step hb-step--plus"
          onClick={inc}
          aria-disabled={done}
          aria-label={`${habit.name}: bir ${unit} ekle`}
        >
          {done ? <Check size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showDots ? (
        <div className="hb-dots" aria-hidden="true">
          {Array.from({ length: habit.target }, (_, i) => (
            <span key={i} className={`hb-dot ${i < count ? 'is-on' : ''}`} style={{ transitionDelay: `${i * 25}ms` }} />
          ))}
        </div>
      ) : (
        <div className="hb-bar" aria-hidden="true">
          <span style={{ width: `${(count / habit.target) * 100}%` }} />
        </div>
      )}

      <div className="hb-week" role="group" aria-label="Bu hafta">
        {week.map((key, i) => {
          const d = fromKey(key);
          const c = countOn(habit, key);
          const isFuture = key > today;
          const label = `${DAYS_SHORT[i]}, ${d.getDate()} ${MONTHS[d.getMonth()]}: ${isFuture ? 'henüz gelmedi' : `${Math.min(c, habit.target)}/${habit.target} ${unit}`}`;
          return (
            <div key={key} className="hb-week-col">
              <MiniRing ratio={isFuture ? 0 : ratioOn(habit, key)} isToday={key === today} isFuture={isFuture} label={label} />
              <span className={`hb-week-label ${key === today ? 'is-today' : ''}`} aria-hidden="true">
                {DAYS_SHORT[i]}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default HabitCard;
