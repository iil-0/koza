import BearAvatar from './BearAvatar';
import { BEARS, bearById } from './bears';
import './AvatarPicker.css';

/** Radio-style grid for choosing a bear avatar. */
function AvatarPicker({ value, onChange, label = 'Ayını seç' }) {
  return (
    <fieldset className="ap-avatars">
      <legend className="field-label">{label}</legend>
      <div className="ap-grid" role="radiogroup" aria-label={label}>
        {BEARS.map((bear) => {
          const selected = bearById(value).id === bear.id;
          return (
            <button
              key={bear.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className="ap-option"
              onClick={() => onChange(bear.id)}
              title={`${bear.name} · ${bear.desc}`}
            >
              <BearAvatar size={46} variant={bear.id} />
              <span className="ap-name">{bear.name}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default AvatarPicker;
