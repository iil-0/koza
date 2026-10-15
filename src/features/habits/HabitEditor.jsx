import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { HABIT_ICONS } from '../../components/habitIcons';
import { useApp } from '../../store/useApp';
import { HABIT_COLORS } from './habitUtils';
import './HabitsPage.css';

const ICON_LABELS = {
  'cup-soda': 'Su', dumbbell: 'Spor', 'book-open': 'Kitap', footprints: 'Yürüyüş', bike: 'Bisiklet',
  brain: 'Zihin', moon: 'Uyku', sun: 'Sabah', leaf: 'Doğa', apple: 'Beslenme', pill: 'Vitamin',
  music: 'Müzik', guitar: 'Enstrüman', palette: 'Sanat', 'pen-line': 'Yazı', languages: 'Dil',
  code: 'Kod', coffee: 'Kahve', heart: 'Öz bakım', sparkles: 'Diğer',
};

/** Mount only while open. habit = existing (edit) or undefined (new) */
function HabitEditor({ habit, onClose }) {
  const { addHabit, updateHabit, deleteHabit } = useApp();
  const [name, setName] = useState(habit?.name || '');
  const [icon, setIcon] = useState(habit?.icon || 'sparkles');
  const [color, setColor] = useState(habit?.color || 'lavender');
  const [target, setTarget] = useState(String(habit?.target || 1));
  const [unit, setUnit] = useState(habit?.unit || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const targetNum = Math.max(1, Math.min(99, parseInt(target, 10) || 1));
  const valid = name.trim().length > 0;

  const save = (e) => {
    e?.preventDefault();
    if (!valid) return;
    const data = { name: name.trim(), icon, color, target: targetNum, unit: unit.trim() };
    if (habit) updateHabit(habit.id, data);
    else addHabit(data);
    onClose();
  };

  const remove = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteHabit(habit.id);
    onClose();
  };

  return (
    <Modal
      open
      title={habit ? 'Alışkanlığı düzenle' : 'Yeni alışkanlık'}
      onClose={onClose}
      width={520}
      footer={
        <div className="he-foot">
          {habit && (
            <button
              type="button"
              className={`btn btn-sm he-delete ${confirmDelete ? 'is-confirm' : ''}`}
              onClick={remove}
              onBlur={() => setConfirmDelete(false)}
            >
              <Trash2 size={15} />
              {confirmDelete ? 'Emin misin?' : 'Sil'}
            </button>
          )}
          <span className="he-spacer" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" form="habit-form" className="btn btn-primary btn-sm" disabled={!valid}>
            <Check size={15} />
            {habit ? 'Kaydet' : 'Ekle'}
          </button>
        </div>
      }
    >
      <form id="habit-form" className="he" onSubmit={save}>
        <div className="he-preview" data-color={color} aria-hidden="true">
          <span className="hb-icon">
            <Icon name={icon} size={22} strokeWidth={1.9} />
          </span>
          <span className="he-preview-text">
            <strong>{name.trim() || 'Yeni alışkanlık'}</strong>
            <span>
              Günde {targetNum} {unit.trim() || 'kez'}
            </span>
          </span>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="he-name">Ad</label>
          <input
            id="he-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ör. Meditasyon"
            maxLength={40}
            autoComplete="off"
            required
          />
        </div>

        <fieldset className="he-fieldset">
          <legend className="field-label">Simge</legend>
          <div className="he-icons" role="radiogroup" aria-label="Simge">
            {Object.keys(HABIT_ICONS).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                aria-label={ICON_LABELS[key] || key}
                title={ICON_LABELS[key] || key}
                className="he-icon"
                data-color={color}
                onClick={() => setIcon(key)}
              >
                <Icon name={key} size={19} strokeWidth={1.9} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="he-fieldset">
          <legend className="field-label">Renk</legend>
          <div className="he-colors" role="radiogroup" aria-label="Renk">
            {HABIT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={color === c.id}
                aria-label={c.label}
                title={c.label}
                data-color={c.id}
                className="he-color"
                onClick={() => setColor(c.id)}
              />
            ))}
          </div>
        </fieldset>

        <div className="he-row">
          <div className="field">
            <label className="field-label" htmlFor="he-target">Günlük hedef</label>
            <input
              id="he-target"
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onBlur={() => setTarget(String(targetNum))}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="he-unit">Birim</label>
            <input
              id="he-unit"
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="bardak, sayfa, dk…"
              maxLength={16}
              autoComplete="off"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default HabitEditor;
