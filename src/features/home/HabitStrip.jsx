import { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useApp } from '../../store/useApp';
import Icon from '../../components/Icon';
import './HabitStrip.css';

const QUOTES = [
  { text: 'Küçük adımlarla da ilerlemektir.', color: 'yellow' },
  { text: 'Mükemmel değil, istikrarlı ol.', color: 'pink' },
  { text: 'Bugün ektiğin, yarın çiçek açar.', color: 'sage' },
  { text: 'Yavaşlamak da bir ilerleyiş.', color: 'blue' },
  { text: 'Bir bardak su, bir derin nefes.', color: 'lavender' },
  { text: 'Kendine iyi bak, gerisi gelir.', color: 'peach' },
];

const MAX_DOTS = 10;

/* ------------------------------------------------------------------ */

/** Potted sprout that grows leaves (and finally a flower) with progress 0..1 */
function GrowingSprout({ progress }) {
  const stem = 0.36 + 0.64 * progress; // stem scale
  const lift = (1 - stem) * 22; // how far the crown sits below full height
  const stage = progress >= 1 ? 4 : progress >= 0.67 ? 3 : progress >= 0.34 ? 2 : progress > 0 ? 1 : 0;
  return (
    <svg className="hs-sprout" viewBox="0 0 40 46" aria-hidden="true" focusable="false" data-stage={stage}>
      <rect className="hs-sprout-stem" x="19" y="9" width="2.2" height="23" rx="1.1" style={{ transform: `scaleY(${stem})` }} />
      <path className="hs-sprout-leaf hs-sprout-leaf--1" d="M20 27c-5.5.6-9.4-2.2-10.4-7.4 5.4-.6 9.4 2.2 10.4 7.4Z" />
      <g className="hs-sprout-crown" style={{ transform: `translateY(${lift}px)` }}>
        <path className="hs-sprout-leaf hs-sprout-leaf--0" d="M20.4 12.6c.4-4.6 3.4-7.4 8.2-7.4.2 4.8-3 7.6-8.2 7.4Z" />
        <path className="hs-sprout-leaf hs-sprout-leaf--2" d="M20 19c4.6.6 8-1.6 9-6-4.6-.6-8 1.6-9 6Z" />
        <path className="hs-sprout-leaf hs-sprout-leaf--3" d="M19.8 11.4c-4.2.2-6.8-2-7.2-6 4.2-.2 6.8 2 7.2 6Z" />
        <g className="hs-sprout-flower" transform="translate(20 7)">
          <g className="hs-sprout-bloom">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-3.6" rx="2.4" ry="3.4" transform={`rotate(${a})`} />
            ))}
            <circle r="2.1" className="hs-sprout-flower-mid" />
          </g>
        </g>
      </g>
      <path className="hs-sprout-pot" d="M9 31h22l-2.6 13H11.6Z" />
      <rect className="hs-sprout-rim" x="7.5" y="29" width="25" height="5" rx="2" />
    </svg>
  );
}

function FocusScore() {
  const { todos, today, setView } = useApp();
  const { done, total } = useMemo(() => {
    const list = todos.filter((t) => !t.archived && t.date === today);
    return { done: list.filter((t) => t.completed).length, total: list.length };
  }, [todos, today]);

  const progress = total ? done / total : 0;
  const R = 23;
  const C = 2 * Math.PI * R;
  const left = total - done;
  const note = total === 0 ? 'bugün boş, keyfine bak' : left === 0 ? 'hepsi tamam ♡' : `${left} görev kaldı`;

  return (
    <button
      type="button"
      className={`hs-tile hs-score${total && left === 0 ? ' is-complete' : ''}`}
      onClick={() => setView('tasks')}
      aria-label={`Bugünün odak puanı: ${done}/${total}. ${note}. Görevlere git.`}
    >
      <GrowingSprout progress={progress} />
      <span className="hs-score-text">
        <span className="hs-score-label">
          Bugünün
          <br />
          odak puanı
        </span>
        <span className="hs-score-note hand">{note}</span>
      </span>
      <span className="hs-ring">
        <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">
          <circle className="hs-ring-track" cx="30" cy="30" r={R} />
          <circle
            className="hs-ring-bar"
            cx="30"
            cy="30"
            r={R}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            transform="rotate(-90 30 30)"
          />
        </svg>
        <span className="hs-ring-num">
          {done}/{total}
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */

function HabitTile({ habit, today, onTap }) {
  const count = Math.min(habit.log?.[today] || 0, habit.target);
  const done = count >= habit.target;
  const [fx, setFx] = useState(null); // { n, label } — drives the "+1" float & dot pop

  const tap = () => {
    setFx((prev) => ({ n: (prev?.n || 0) + 1, label: done ? '↺' : '+1' }));
    onTap(habit.id);
  };

  const showDots = habit.target <= MAX_DOTS;
  const unit = habit.unit ? ` ${habit.unit}` : '';

  return (
    <button
      type="button"
      className={`hs-tile hs-habit${done ? ' is-done' : ''}`}
      data-color={habit.color}
      onClick={tap}
      aria-label={`${habit.name}: ${count}/${habit.target}${unit}. ${done ? 'Tamamlandı, sıfırlamak için dokun.' : 'Bir tane ekle.'}`}
    >
      <span className="hs-habit-top">
        <span className={`hs-habit-icon${fx ? ' is-bump' : ''}`} key={fx ? `i${fx.n}` : 'i'}>
          <Icon name={habit.icon} size={19} strokeWidth={2} />
        </span>
        <span className="hs-habit-name">{habit.name}</span>
      </span>

      {showDots ? (
        <span className="hs-dots" aria-hidden="true">
          {Array.from({ length: habit.target }, (_, i) => {
            const filled = i < count;
            const fresh = fx && filled && i === count - 1;
            return (
              <span
                key={fresh ? `d${i}-${fx.n}` : `d${i}`}
                className={`hs-dot${filled ? ' is-on' : ''}${fresh ? ' is-pop' : ''}`}
              />
            );
          })}
        </span>
      ) : (
        <span className="hs-bar" aria-hidden="true">
          <span style={{ width: `${(count / habit.target) * 100}%` }} />
        </span>
      )}

      <span className="hs-habit-count" aria-hidden="true">
        {count}/{habit.target}
        {unit}
      </span>

      {done && (
        <span className="hs-done-badge" aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      {fx && (
        <span key={fx.n} className="hs-float" aria-hidden="true">
          {fx.label}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */

function QuoteTile() {
  const [index, setIndex] = useState(() => {
    const d = new Date();
    return (d.getDate() + d.getMonth()) % QUOTES.length;
  });
  const q = QUOTES[index];
  return (
    <button
      type="button"
      className="hs-tile hs-quote"
      data-color={q.color}
      onClick={() => setIndex((i) => (i + 1) % QUOTES.length)}
      title="Başka bir söz"
    >
      <span className="hs-quote-paper" key={index}>
        <span className="hs-quote-text hand">
          “{q.text}” <span className="hs-heart">♡</span>
        </span>
      </span>
      <span className="sr-only"> — sonraki söz için tıkla</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */

function HabitStrip() {
  const { habits, today, incrementHabit, setView } = useApp();
  const shown = habits.slice(0, 3);

  return (
    <section className="hs" aria-label="Bugünün özeti ve alışkanlıklar">
      <div className="hs-row scroll-thin" style={{ '--hs-n': Math.max(shown.length, 1) }}>
        <FocusScore />
        {shown.map((h) => (
          <HabitTile key={h.id} habit={h} today={today} onTap={incrementHabit} />
        ))}
        {shown.length === 0 && (
          <button type="button" className="hs-tile hs-empty" onClick={() => setView('habits')}>
            <Plus size={18} aria-hidden="true" />
            <span>Alışkanlık ekle</span>
          </button>
        )}
        <QuoteTile />
      </div>
    </section>
  );
}

export default HabitStrip;
