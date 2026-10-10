import { useId, useRef, useState } from 'react';
import { Archive, Star } from 'lucide-react';
import Modal from '../../components/Modal';
import { useApp } from '../../store/useApp';
import { addDays } from '../../lib/date';
import { DEFAULT_LIST } from './taskUtils';
import './tasks.css';

function TaskForm({ formId, task, defaults, onDone }) {
  const { today, lists, addTodo, updateTodo } = useApp();
  const fallbackList = lists.some((l) => l.id === DEFAULT_LIST) ? DEFAULT_LIST : lists[0]?.id || DEFAULT_LIST;
  const [text, setText] = useState(task?.text ?? '');
  const [listId, setListId] = useState(task?.listId ?? defaults?.listId ?? fallbackList);
  const [date, setDate] = useState(task?.date ?? defaults?.date ?? today);
  const [time, setTime] = useState(task?.time ?? '');
  const [starred, setStarred] = useState(task?.starred ?? false);
  const [error, setError] = useState(false);
  const textRef = useRef(null);
  const ids = useId();

  const submit = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) {
      setError(true);
      textRef.current?.focus();
      return;
    }
    const data = { text: clean, listId, date, time, starred };
    if (task) updateTodo(task.id, data);
    else addTodo(data);
    onDone();
  };

  const tomorrow = addDays(today, 1);

  return (
    <form id={formId} className="task-form" onSubmit={submit} noValidate>
      <label className="field">
        <span className="field-label">Görev</span>
        <input
          ref={textRef}
          className={`input${error ? ' task-input-error' : ''}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(false);
          }}
          placeholder="Ne yapmak istiyorsun?"
          maxLength={140}
          aria-invalid={error}
          aria-describedby={error ? `${ids}-err` : undefined}
        />
        {error && (
          <span id={`${ids}-err`} className="task-form-error hand">
            Önce bir şey yazmalısın ♡
          </span>
        )}
      </label>

      <div className="field">
        <span className="field-label" id={`${ids}-list`}>
          Liste
        </span>
        <div className="task-list-pick" role="radiogroup" aria-labelledby={`${ids}-list`}>
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={listId === l.id}
              data-color={l.color}
              className="task-list-opt"
              onClick={() => setListId(l.id)}
            >
              <span className="dot" aria-hidden="true" />
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div className="task-form-row">
        <label className="field">
          <span className="field-label">Tarih</span>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Saat</span>
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <div className="task-form-quick">
        <button type="button" className="chip" aria-pressed={date === today} onClick={() => setDate(today)}>
          Bugün
        </button>
        <button type="button" className="chip" aria-pressed={date === tomorrow} onClick={() => setDate(tomorrow)}>
          Yarın
        </button>
        <button type="button" className="chip" aria-pressed={date === ''} onClick={() => setDate('')}>
          Tarihsiz
        </button>
        <button
          type="button"
          className="chip task-star-chip"
          aria-pressed={starred}
          onClick={() => setStarred((s) => !s)}
        >
          <Star size={15} aria-hidden="true" />
          Yıldızlı
        </button>
      </div>
    </form>
  );
}

/**
 * Add / edit task dialog.
 * props: open, onClose, task (edit mode when given), defaults { listId, date }
 */
function TaskModal({ open, onClose, task, defaults }) {
  const { archiveTodo } = useApp();
  const formId = useId();
  const isEdit = !!task;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Görevi düzenle' : 'Yeni görev'}
      width={500}
      footer={
        <>
          {isEdit && (
            <button
              type="button"
              className="btn btn-ghost task-foot-left"
              onClick={() => {
                archiveTodo(task.id);
                onClose();
              }}
            >
              <Archive size={16} aria-hidden="true" />
              Arşivle
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            {isEdit ? 'Kaydet' : 'Ekle'}
          </button>
        </>
      }
    >
      {open && <TaskForm key={task?.id || 'new'} formId={formId} task={task} defaults={defaults} onDone={onClose} />}
    </Modal>
  );
}

export default TaskModal;
