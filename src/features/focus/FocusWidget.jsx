import { useState } from 'react';
import { Settings, Sprout } from 'lucide-react';
import { CycleDots, DurationPicker, FocusSettingsModal, ModePills, TimerControls, TimerRing } from './FocusParts';
import Polaroids from './Polaroids';
import { MODE_MOODS, formatTime, useFocusTimer } from './focusShared';
import './FocusWidget.css';

function FocusWidget() {
  const { mode, running, remaining, progress, modeLabel } = useFocusTimer();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <section className="card fw" data-running={running || undefined} aria-labelledby="fw-title">
      <Polaroids />

      <header className="card-head fw-head">
        <h2 className="card-title" id="fw-title">
          <span className="fw-sprout" aria-hidden="true">
            <Sprout size={22} />
          </span>
          Odaklan
        </h2>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Zamanlayıcı ayarları"
          title="Ayarlar"
        >
          <Settings size={19} />
        </button>
      </header>

      <ModePills className="fw-widget-pills" />
      <DurationPicker compact />

      <div className="fw-stage">
        <TimerRing progress={progress} mode={mode} running={running} className="fw-widget-ring">
          <span className="fw-mood hand" aria-hidden="true">
            {MODE_MOODS[mode]}
          </span>
          <span className="fw-time" role="timer" aria-label={`${modeLabel}: ${formatTime(remaining)} kaldı`}>
            {formatTime(remaining)}
          </span>
          <CycleDots />
        </TimerRing>
      </div>

      <TimerControls />

      <FocusSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </section>
  );
}

export default FocusWidget;
