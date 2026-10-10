import { useEffect, useRef, useState } from 'react';
import { Archive, Check, CalendarArrowUp, CalendarCheck, Pencil, Star, StarOff } from 'lucide-react';
import { useApp } from '../../store/useApp';
import TaskMenu from './TaskMenu';
import { isOverdue, postponeTarget, relativeDate } from './taskUtils';
import './tasks.css';

// particle burst: angle + palette tone, hearts alternate with dots
const BURST = [
  { a: 0, c: 'pink', h: true },
  { a: 45, c: 'yellow' },
  { a: 90, c: 'peach', h: true },
  { a: 135, c: 'sage' },
  { a: 180, c: 'coral', h: true },
  { a: 225, c: 'lavender' },
  { a: 270, c: 'pink', h: true },
  { a: 315, c: 'blue' },
];

/** Delay before a freshly-checked task re-sorts, so the burst can be seen */
const SETTLE_MS = 520;

/**
 * Shared task row.
 * props: todo, list (meta or undefined), today, showDate, onEdit(todo)
 */
function TaskRow({ todo, list, today, showDate = false, onEdit }) {
  const { toggleTodo, updateTodo, archiveTodo } = useApp();
  const [pending, setPending] = useState(false);
  const [burst, setBurst] = useState(0);
  const [starPop, setStarPop] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const done = todo.completed || pending;
  const overdue = isOverdue(todo, today) && !pending;

  const onCheck = () => {
    if (pending) return;
    if (todo.completed) {
      toggleTodo(todo.id);
      return;
    }
    setPending(true);
    setBurst((n) => n + 1);
    // not tracked in `timers`: the toggle must still land if the row unmounts meanwhile
    setTimeout(() => {
      toggleTodo(todo.id);
      setPending(false);
    }, SETTLE_MS);
    later(() => setBurst(0), 900);
  };

  const onStar = () => {
    if (!todo.starred) {
      setStarPop(true);
      later(() => setStarPop(false), 500);
    }
    updateTodo(todo.id, { starred: !todo.starred });
  };

  const menuItems = [
    { label: 'Düzenle', icon: Pencil, onSelect: () => onEdit?.(todo) },
    ...(!todo.completed && todo.date && todo.date < today
      ? [{ label: 'Bugüne al', icon: CalendarCheck, onSelect: () => updateTodo(todo.id, { date: today }) }]
      : []),
    {
      label: todo.date && todo.date > today ? 'Bir gün ertele' : 'Yarına ertele',
      icon: CalendarArrowUp,
      onSelect: () => updateTodo(todo.id, { date: postponeTarget(todo, today) }),
    },
    {
      label: todo.starred ? 'Yıldızı kaldır' : 'Yıldızla',
      icon: todo.starred ? StarOff : Star,
      onSelect: onStar,
    },
    { label: 'Arşivle', icon: Archive, onSelect: () => archiveTodo(todo.id), danger: true },
  ];

  const dateLabel = showDate && todo.date !== today ? relativeDate(todo.date, today) : null;

  return (
    <li className={`task-row${done ? ' is-done' : ''}${pending ? ' is-settling' : ''}`}>
      <span className="task-check-wrap">
        <button
          type="button"
          className={`check task-check${burst ? ' is-pop' : ''}`}
          aria-pressed={done}
          aria-label={done ? `"${todo.text}" tamamlanmadı olarak işaretle` : `"${todo.text}" tamamlandı olarak işaretle`}
          onClick={onCheck}
        />
        {burst > 0 && (
          <span className="task-burst" key={burst} aria-hidden="true">
            {BURST.map((p) => (
              <i
                key={p.a}
                data-color={p.c}
                className={p.h ? 'is-heart' : undefined}
                style={{ '--a': `${p.a}deg` }}
              />
            ))}
          </span>
        )}
      </span>

      <div className="task-main">
        <button
          type="button"
          className="task-text"
          onClick={() => onEdit?.(todo)}
          title="Düzenle"
        >
          <span>{todo.text}</span>
        </button>
        <span className="task-meta">
          {list && (
            <span className="tag task-tag" data-color={list.color}>
              {list.name}
            </span>
          )}
          {overdue && <span className="task-badge is-late">gecikti</span>}
          {dateLabel && !overdue && <span className="task-badge">{dateLabel}</span>}
          {dateLabel && overdue && <span className="task-date-late">{dateLabel}</span>}
        </span>
      </div>

      <span className={`task-time${done ? ' is-done' : ''}`}>
        {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
        {todo.time && <time>{todo.time}</time>}
        {done && <span className="sr-only">tamamlandı</span>}
      </span>

      <button
        type="button"
        className={`icon-btn task-star${starPop ? ' is-pop' : ''}`}
        aria-pressed={!!todo.starred}
        aria-label={todo.starred ? 'Yıldızı kaldır' : 'Yıldızla'}
        onClick={onStar}
      >
        <Star size={18} />
      </button>

      <TaskMenu items={menuItems} label={`"${todo.text}" seçenekleri`} />
    </li>
  );
}

export default TaskRow;
