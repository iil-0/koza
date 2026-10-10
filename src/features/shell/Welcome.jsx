import { useState } from 'react';
import { LoaderCircle, LocateFixed, Lock } from 'lucide-react';
import Modal from '../../components/Modal';
import { useApp } from '../../store/useApp';
import { getCurrentPlace } from '../../lib/location';
import BearAvatar from './BearAvatar';
import AvatarPicker from './AvatarPicker';
import './Welcome.css';

function WelcomeDialog({ user, onSave, onSkip }) {
  const returning = Boolean(user.name);
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || 'bruno');
  const [city, setCity] = useState(user.city || '');
  const [coords, setCoords] = useState(
    user.lat != null && user.lon != null ? { lat: user.lat, lon: user.lon, city: user.city } : null
  );
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const locate = async () => {
    setStatus({ state: 'loading', message: '' });
    try {
      const place = await getCurrentPlace();
      setCoords(place);
      setCity(place.city);
      setStatus({ state: 'ok', message: place.city ? `${place.city} bulundu` : 'Konumun alındı' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const typed = city.trim();
    // coordinates only apply while the city field still matches what geolocation found
    const useCoords = coords && typed === (coords.city || '');
    onSave({
      name: name.trim(),
      avatar,
      city: typed,
      lat: useCoords ? coords.lat : null,
      lon: useCoords ? coords.lon : null,
      onboarded: true,
    });
  };

  return (
    <Modal
      open
      title={returning ? 'Konumunu ekle' : 'Hoş geldin'}
      onClose={onSkip}
      width={460}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onSkip}>
            Şimdilik geç
          </button>
          <button type="submit" form="welcome-form" className="btn btn-primary">
            {returning ? 'Kaydet' : 'Başlayalım'}
          </button>
        </>
      }
    >
      <form id="welcome-form" className="wl" onSubmit={submit}>
        <div className="wl-hero">
          <BearAvatar size={68} variant={avatar} />
          <p className="hand wl-hello">merhaba {name.trim() || 'sen'} ♡</p>
        </div>

        {!returning && <AvatarPicker value={avatar} onChange={setAvatar} />}

        <label className="field">
          <span className="field-label">Sana nasıl hitap edelim?</span>
          <input
            className="input"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adın"
            autoComplete="given-name"
          />
        </label>

        <div className="field">
          <span className="field-label">Hava durumu için konumun</span>
          <button
            type="button"
            className="btn btn-soft wl-locate"
            onClick={locate}
            disabled={status.state === 'loading'}
          >
            {status.state === 'loading' ? (
              <LoaderCircle size={16} className="wl-spin" aria-hidden="true" />
            ) : (
              <LocateFixed size={16} aria-hidden="true" />
            )}
            Konumumu kullan
          </button>
          {status.message && (
            <p className={`wl-status ${status.state === 'error' ? 'is-error' : ''}`} role="status">
              {status.message}
            </p>
          )}
          <input
            className="input"
            value={city}
            maxLength={40}
            onChange={(e) => setCity(e.target.value)}
            placeholder="ya da şehrini yaz (ör. İzmir)"
            aria-label="Şehir"
            autoComplete="address-level2"
          />
        </div>

        <p className="wl-privacy">
          <Lock size={13} aria-hidden="true" />
          Görevlerin, notların ve bilgilerin yalnızca bu tarayıcıda saklanır; kimseyle paylaşılmaz.
        </p>
      </form>
    </Modal>
  );
}

/** First-visit onboarding (also reopened from the hero to add a location). */
function Welcome() {
  const { user, updateUser } = useApp();
  if (user.onboarded) return null;
  return <WelcomeDialog user={user} onSave={updateUser} onSkip={() => updateUser({ onboarded: true })} />;
}

export default Welcome;
