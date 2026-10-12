import { useId, useState } from 'react';
import { Bell, Check, Pause, Pencil, Play, RotateCcw, SkipForward, Volume2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { MODES, MODE_LABELS, useFocusTimer } from './focusShared';
import './FocusParts.css';

/* Shared building blocks for the focus widget & page. */

export function ModePills({ className = '' }) {
  const { mode, setMode } = useFocusTimer();
  return (
    <div className={`fw-pills ${className}`} role="group" aria-label="Zamanlayıcı modu">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          className="fw-pill"
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}

const PRESETS = {
  pomodoro: [15, 25, 45, 60],
  short: [5, 10, 15],
  long: [15, 20, 30],
};

const MAX_MINUTES = { pomodoro: 180, short: 60, long: 90 };

/** Quick duration chips for the current mode + a custom minutes input. */
export function DurationPicker({ className = '', compact = false }) {
  const { mode, settings, updateSettings, running } = useFocusTimer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const current = settings[mode];
  const presets = PRESETS[mode];
  const isCustom = !presets.includes(current);
  const max = MAX_MINUTES[mode];

  const pick = (minutes) => {
    updateSettings({ [mode]: minutes });
    setEditing(false);
  };

  const openCustom = () => {
    setDraft(String(current));
    setEditing(true);
  };

  const applyCustom = (e) => {
    e.preventDefault();
    const n = Math.round(Number(draft));
    if (!Number.isFinite(n) || n < 1) return;
    pick(Math.min(max, n));
  };

  return (
    <div
      className={`fw-durs ${compact ? 'fw-durs--compact' : ''} ${className}`}
      role="group"
      aria-label="Süre seç"
      title={running ? 'Süreyi değiştirmek için önce duraklat' : undefined}
    >
      {presets.map((m) => (
        <button
          key={m}
          type="button"
          className="fw-dur"
          aria-pressed={current === m}
          disabled={running}
          onClick={() => pick(m)}
          aria-label={`${m} dakika`}
        >
          {compact ? m : `${m} dk`}
        </button>
      ))}

      {editing ? (
        <form className="fw-dur-form" onSubmit={applyCustom}>
          <input
            className="fw-dur-input"
            type="number"
            min="1"
            max={max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setEditing(false);
              }
            }}
            aria-label={`Özel süre (1–${max} dakika)`}
            autoFocus
          />
          <span className="fw-dur-unit" aria-hidden="true">dk</span>
          <button type="submit" className="fw-dur-ok" aria-label="Süreyi uygula">
            <Check size={14} strokeWidth={3} />
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="fw-dur"
          aria-pressed={isCustom}
          disabled={running}
          onClick={openCustom}
          aria-label={isCustom ? `Özel süre: ${current} dakika, değiştir` : 'Özel süre gir'}
        >
          {isCustom ? (compact ? current : `${current} dk`) : compact ? null : 'Özel'}
          <Pencil size={12} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** SVG progress ring. `progress` = remaining fraction (1 → full ring). */
export function TimerRing({ progress, mode, running, stroke = 11, className = '', children }) {
  const rawId = useId();
  const gid = `fw-grad-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const r = 100 - stroke / 2 - 8;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  const angle = (p * 360 - 90) * (Math.PI / 180);
  const kx = 100 + r * Math.cos(angle);
  const ky = 100 + r * Math.sin(angle);

  return (
    <div className={`fw-ring ${className}`} data-mode={mode} data-running={running || undefined}>
      <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--arc-a)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--arc-b)' }} />
          </linearGradient>
        </defs>
        <circle className="fw-ring-track" cx="100" cy="100" r={r} strokeWidth={stroke} />
        <circle
          className="fw-ring-arc"
          cx="100"
          cy="100"
          r={r}
          strokeWidth={stroke}
          stroke={`url(#${gid})`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform="rotate(-90 100 100)"
        />
        {p > 0.005 && <circle className="fw-ring-knob" cx={kx} cy={ky} r={stroke / 2 - 2.5} />}
      </svg>
      <div className="fw-ring-center">{children}</div>
    </div>
  );
}

export function CycleDots({ className = '' }) {
  const { cycle, mode, settings } = useFocusTimer();
  const total = settings.longEvery;
  const current = Math.min(cycle + (mode === 'pomodoro' ? 1 : 0), total);
  const label = mode === 'pomodoro' ? `${total} seanstan ${current}.` : `${Math.min(cycle, total)}/${total} tamam`;
  return (
    <div className={`fw-cycle ${className}`}>
      <span className="fw-cycle-dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i
            key={i}
            className={i < cycle ? 'is-done' : i === cycle && mode === 'pomodoro' ? 'is-now' : ''}
          />
        ))}
      </span>
      <span className="fw-cycle-text">{label}</span>
    </div>
  );
}

export function TimerControls({ size = 'md' }) {
  const { running, toggle, reset, skip, remaining, total } = useFocusTimer();
  const iconSize = size === 'lg' ? 20 : 17;
  return (
    <div className={`fw-controls fw-controls--${size}`}>
      <button
        type="button"
        className="icon-btn fw-side-btn"
        onClick={reset}
        aria-label="Sıfırla"
        title="Sıfırla"
        disabled={!running && remaining === total}
      >
        <RotateCcw size={iconSize} />
      </button>
      <button type="button" className="btn btn-primary fw-main-btn" onClick={toggle} aria-pressed={running}>
        {running ? <Pause size={iconSize - 1} fill="currentColor" /> : <Play size={iconSize - 1} fill="currentColor" />}
        {running ? 'Duraklat' : remaining < total ? 'Devam et' : 'Başlat'}
      </button>
      <button type="button" className="icon-btn fw-side-btn" onClick={skip} aria-label="Sonraki aşamaya geç" title="Atla">
        <SkipForward size={iconSize} />
      </button>
    </div>
  );
}

/* ---------------- settings ---------------- */

function SettingsForm({ formId, onDone }) {
  const { settings, updateSettings, previewSound } = useFocusTimer();
  const [draft, setDraft] = useState(settings);
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const set = (k) => (e) =>
    setDraft((d) => ({ ...d, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const askPerm = async () => {
    try {
      const res = await Notification.requestPermission();
      setPerm(res);
    } catch {
      /* ignore */
    }
  };

  return (
    <form
      id={formId}
      className="fw-settings"
      onSubmit={(e) => {
        e.preventDefault();
        updateSettings(draft);
        onDone();
      }}
    >
      <fieldset className="fw-durations">
        <legend className="field-label">Süreler (dakika)</legend>
        <label className="field">
          <span className="fw-mini-label">Pomodoro</span>
          <input className="input" type="number" min="1" max="180" required value={draft.pomodoro} onChange={set('pomodoro')} />
        </label>
        <label className="field">
          <span className="fw-mini-label">Kısa mola</span>
          <input className="input" type="number" min="1" max="60" required value={draft.short} onChange={set('short')} />
        </label>
        <label className="field">
          <span className="fw-mini-label">Uzun mola</span>
          <input className="input" type="number" min="1" max="90" required value={draft.long} onChange={set('long')} />
        </label>
      </fieldset>

      <label className="fw-setting-row">
        <span>
          <strong>Uzun mola sıklığı</strong>
          <small>Kaç pomodoroda bir uzun mola verilsin?</small>
        </span>
        <input
          className="input fw-num-sm"
          type="number"
          min="2"
          max="8"
          required
          value={draft.longEvery}
          onChange={set('longEvery')}
        />
      </label>

      <label className="fw-setting-row">
        <span>
          <strong>Otomatik başlat</strong>
          <small>Bir aşama bitince sonraki kendiliğinden başlasın.</small>
        </span>
        <input type="checkbox" role="switch" className="fw-switch" checked={draft.autoStart} onChange={set('autoStart')} />
      </label>

      <div className="fw-setting-row">
        <label htmlFor={`${formId}-sound`}>
          <strong>Bitiş sesi</strong>
          <small>Seans bitince yumuşak bir çan çalsın.</small>
        </label>
        <span className="fw-row-actions">
          <button type="button" className="icon-btn" onClick={previewSound} aria-label="Sesi dinle" title="Dinle">
            <Volume2 size={17} />
          </button>
          <input
            id={`${formId}-sound`}
            type="checkbox"
            role="switch"
            className="fw-switch"
            checked={draft.sound}
            onChange={set('sound')}
          />
        </span>
      </div>

      <div className="fw-setting-row fw-perm">
        <span>
          <strong>
            <Bell size={14} aria-hidden="true" /> Bildirimler
          </strong>
          <small>
            {perm === 'granted' && 'Açık — seans bitince haber vereceğim.'}
            {perm === 'denied' && 'Tarayıcı ayarlarından engellenmiş.'}
            {perm === 'default' && 'İlk “Başlat”ta da izin isteyeceğim.'}
            {perm === 'unsupported' && 'Bu tarayıcı bildirimleri desteklemiyor.'}
          </small>
        </span>
        {perm === 'default' && (
          <button type="button" className="btn btn-soft btn-sm" onClick={askPerm}>
            İzin ver
          </button>
        )}
      </div>
    </form>
  );
}

export function FocusSettingsModal({ open, onClose }) {
  const formId = `fw-settings-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Zamanlayıcı ayarları"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            Kaydet
          </button>
        </>
      }
    >
      <SettingsForm formId={formId} onDone={onClose} />
    </Modal>
  );
}
