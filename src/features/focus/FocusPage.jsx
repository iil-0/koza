import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Check, Clock, Flame, ListTodo, Settings, Sparkles, Target, X } from 'lucide-react';
import { useApp, useListMap } from '../../store/useApp';
import { DAYS_SHORT, addDays, fromKey, weekdayMon } from '../../lib/date';
import { CycleDots, DurationPicker, FocusSettingsModal, ModePills, TimerControls, TimerRing } from './FocusParts';
import AmbientMixer from './AmbientMixer';
import { MODE_LABELS, MODE_MOODS, formatTime, useFocusTimer } from './focusShared';
import './FocusPage.css';

const TASK_KEY = 'koza:focusTask';

function useStoredTaskId() {
  const [id, setId] = useState(() => {
    try {
      return localStorage.getItem(TASK_KEY);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (id) localStorage.setItem(TASK_KEY, id);
      else localStorage.removeItem(TASK_KEY);
    } catch {
      /* ignore */
    }
  }, [id]);
  return [id, setId];
}

const fmtMinutes = (m) => {
  if (m < 60) return `${m} dk`;
  const h = Math.round((m / 60) * 10) / 10;
  return `${String(h).replace('.', ',')} sa`;
};

/* ---------------- timer stage ---------------- */

function Stage({ task, onOpenSettings }) {
  const { mode, running, remaining, progress, modeLabel, cycle, settings } = useFocusTimer();
  const nextMode = mode === 'pomodoro' ? (cycle + 1 >= settings.longEvery ? 'long' : 'short') : 'pomodoro';

  return (
    <section className="card fp-stage" data-mode={mode} data-running={running || undefined} aria-label="Zamanlayıcı">
      <div className="fp-motes" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} style={{ '--i': i }} />
        ))}
      </div>

      <div className="fp-stage-top">
        <ModePills />
        <button
          type="button"
          className="icon-btn fp-stage-gear"
          onClick={onOpenSettings}
          aria-label="Zamanlayıcı ayarları"
          title="Ayarlar"
        >
          <Settings size={19} />
        </button>
      </div>

      <DurationPicker className="fp-durs" />

      <TimerRing progress={progress} mode={mode} running={running} stroke={9} className="fp-ring">
        <span className="fp-mood hand" aria-hidden="true">
          {MODE_MOODS[mode]}
        </span>
        <span className="fp-time" role="timer" aria-label={`${modeLabel}: ${formatTime(remaining)} kaldı`}>
          {formatTime(remaining)}
        </span>
        <CycleDots />
      </TimerRing>

      <p className="fp-now">
        {task ? (
          <>
            <Target size={15} aria-hidden="true" />
            <span className="fp-now-label">Şu an:</span>
            <strong>{task.text}</strong>
          </>
        ) : (
          <span className="hand fp-now-free">serbest odak — sadece sen ve zaman ♡</span>
        )}
      </p>

      <TimerControls size="lg" />

      <p className="fp-next">
        Sıradaki: <strong>{MODE_LABELS[nextMode]}</strong> · {settings[nextMode]} dk
        {settings.autoStart && <span className="fp-auto"> · otomatik</span>}
      </p>
    </section>
  );
}

/* ---------------- task picker ---------------- */

function TaskPicker({ openTodos, current, setTaskId }) {
  const { toggleTodo } = useApp();
  const listMap = useListMap();
  const [cheer, setCheer] = useState(null);

  useEffect(() => {
    if (!cheer) return undefined;
    const id = setTimeout(() => setCheer(null), 4000);
    return () => clearTimeout(id);
  }, [cheer]);

  const complete = () => {
    if (!current) return;
    toggleTodo(current.id);
    setCheer(current.text);
    setTaskId(null);
  };

  return (
    <section className="card fp-task" aria-labelledby="fp-task-title">
      <header className="card-head">
        <h2 className="card-title" id="fp-task-title">
          <ListTodo size={20} aria-hidden="true" /> Ne üzerinde çalışıyorsun?
        </h2>
      </header>

      {cheer && (
        <p className="fp-cheer" role="status">
          <Sparkles size={16} aria-hidden="true" /> “{cheer}” bitti. Bravo, kendinle gurur duy!
        </p>
      )}

      {current && (
        <div className="fp-current" data-color={listMap[current.listId]?.color}>
          <span className="fp-current-kicker">Şu an odaklandığın</span>
          <p className="fp-current-text">{current.text}</p>
          <div className="fp-current-meta">
            {listMap[current.listId] && <span className="tag">{listMap[current.listId].name}</span>}
            {current.time && (
              <span className="fp-time-chip">
                <Clock size={13} aria-hidden="true" /> {current.time}
              </span>
            )}
          </div>
          <div className="fp-current-actions">
            <button type="button" className="btn btn-accent btn-sm" onClick={complete}>
              <Check size={16} aria-hidden="true" /> Tamamladım
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTaskId(null)}>
              <X size={15} aria-hidden="true" /> Bırak
            </button>
          </div>
        </div>
      )}

      {openTodos.length === 0 ? (
        <div className="empty">
          <span className="hand">Bugün için açık görev yok ♡</span>
          <span>Serbest bir odak seansına ne dersin?</span>
        </div>
      ) : (
        <fieldset className="fp-picks">
          <legend className="field-label">{current ? 'Ya da başka bir görev seç' : 'Bugünün açık görevlerinden birini seç'}</legend>
          <div className="fp-pick-list scroll-thin">
            {openTodos.map((t) => {
              const list = listMap[t.listId];
              return (
                <label key={t.id} className="fp-pick" data-color={list?.color}>
                  <input
                    type="radio"
                    name="fp-focus-task"
                    value={t.id}
                    checked={current?.id === t.id}
                    onChange={() => setTaskId(t.id)}
                  />
                  <span className="dot" aria-hidden="true" />
                  <span className="fp-pick-text">{t.text}</span>
                  {t.time && <span className="fp-pick-time">{t.time}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </section>
  );
}

/* ---------------- stats ---------------- */

function Stats() {
  const { focusLog, today } = useApp();
  const { settings } = useFocusTimer();
  const todayLog = focusLog[today] || { sessions: 0, minutes: 0 };

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const key = addDays(today, i - 6);
        return {
          key,
          minutes: focusLog[key]?.minutes || 0,
          label: i === 6 ? 'Bugün' : DAYS_SHORT[weekdayMon(fromKey(key))],
        };
      }),
    [focusLog, today]
  );
  const weekTotal = days.reduce((s, d) => s + d.minutes, 0);
  const max = Math.max(50, ...days.map((d) => d.minutes));
  const goal = settings.longEvery;
  const left = Math.max(0, goal - todayLog.sessions);

  return (
    <section className="card fp-stats" aria-labelledby="fp-stats-title">
      <header className="card-head">
        <h2 className="card-title" id="fp-stats-title">
          <BarChart3 size={20} aria-hidden="true" /> Bugünün özeti
        </h2>
      </header>

      <div className="fp-tiles">
        <div className="fp-tile" data-color="pink">
          <Flame size={18} aria-hidden="true" />
          <strong>{todayLog.sessions}</strong>
          <span>seans</span>
        </div>
        <div className="fp-tile" data-color="peach">
          <Clock size={18} aria-hidden="true" />
          <strong>{todayLog.minutes}</strong>
          <span>dakika</span>
        </div>
        <div className="fp-tile" data-color="sage">
          <BarChart3 size={18} aria-hidden="true" />
          <strong>{fmtMinutes(weekTotal)}</strong>
          <span>son 7 gün</span>
        </div>
      </div>

      <p className="fp-goal hand">
        {left === 0 ? `Günlük ${goal} seans hedefin tamam! 🌱` : `Hedefe ${left} seans kaldı, yavaş yavaş ♡`}
      </p>

      <figure className="fp-chart">
        <figcaption className="field-label">Son 7 gün · odak dakikası</figcaption>
        <ul className="fp-bars">
          {days.map((d) => (
            <li key={d.key} className="fp-bar" data-today={d.key === today || undefined}>
              <span className="fp-bar-val" aria-hidden="true">
                {d.minutes > 0 ? d.minutes : ''}
              </span>
              <span className="fp-bar-track" aria-hidden="true">
                <span className="fp-bar-fill" style={{ '--h': `${(d.minutes / max) * 100}%` }} />
              </span>
              <span className="fp-bar-label" aria-hidden="true">
                {d.label}
              </span>
              <span className="sr-only">
                {d.label}: {d.minutes} dakika
              </span>
            </li>
          ))}
        </ul>
      </figure>
    </section>
  );
}

/* ---------------- page ---------------- */

function FocusPage() {
  const { todos, today } = useApp();
  const [taskId, setTaskId] = useStoredTaskId();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openTodos = useMemo(
    () =>
      todos
        .filter((t) => !t.archived && !t.completed && t.date === today)
        .sort((a, b) => (a.time || '99').localeCompare(b.time || '99')),
    [todos, today]
  );
  const current = openTodos.find((t) => t.id === taskId) || null;

  return (
    <div className="fp">
      <header className="page-head">
        <div>
          <h1 className="page-title">Odaklan</h1>
          <p className="page-sub">Bir fincan çay, tek bir görev ve biraz sessizlik.</p>
        </div>
        <button type="button" className="btn btn-soft" onClick={() => setSettingsOpen(true)}>
          <Settings size={17} aria-hidden="true" /> Ayarlar
        </button>
      </header>

      <div className="fp-grid">
        <div className="fp-area-stage">
          <Stage task={current} onOpenSettings={() => setSettingsOpen(true)} />
        </div>
        <div className="fp-area-task">
          <TaskPicker openTodos={openTodos} current={current} setTaskId={setTaskId} />
        </div>
        <div className="fp-area-stats">
          <Stats />
        </div>
        <div className="fp-area-ambient">
          <AmbientMixer />
        </div>
      </div>

      <FocusSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default FocusPage;
