import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, CalendarDays, ChevronsUpDown, House, Menu, Moon, Plus, RotateCcw, Sprout, SquareCheckBig,
  StickyNote, Sun, Timer, UserPen, X,
} from 'lucide-react';
import { useApp } from '../../store/useApp';
import Modal from '../../components/Modal';
import Brand from './Brand';
import BearAvatar from './BearAvatar';
import AvatarPicker from './AvatarPicker';
import './Sidebar.css';

const NAV = [
  { id: 'home', label: 'Ana Sayfa', icon: House },
  { id: 'tasks', label: 'Görevler', icon: SquareCheckBig },
  { id: 'calendar', label: 'Takvim', icon: CalendarDays },
  { id: 'focus', label: 'Odaklan', icon: Timer },
  { id: 'habits', label: 'Alışkanlıklar', icon: Sprout },
  { id: 'notes', label: 'Notlar', icon: StickyNote },
  { id: 'archive', label: 'Arşiv', icon: Archive },
];

const PALETTE = [
  { id: 'pink', label: 'Pembe' },
  { id: 'coral', label: 'Mercan' },
  { id: 'peach', label: 'Şeftali' },
  { id: 'yellow', label: 'Sarı' },
  { id: 'sage', label: 'Adaçayı' },
  { id: 'blue', label: 'Mavi' },
  { id: 'lavender', label: 'Lavanta' },
];

/** Shared contract with TasksPage: sessionStorage key + window event */
const FILTER_KEY = 'koza:listFilter';
const FILTER_EVENT = 'koza:list-filter';
const ALL = 'all';

function readFilter() {
  try {
    return sessionStorage.getItem(FILTER_KEY) || ALL;
  } catch {
    return ALL;
  }
}

/* ------------------------------------------------------------------ */

function ThemeIcon({ theme, size = 18 }) {
  return theme === 'dark' ? <Sun size={size} /> : <Moon size={size} />;
}

export function MobileBar({ onMenu }) {
  const { theme, toggleTheme, setView } = useApp();
  return (
    <header className="sb-mobilebar">
      <button type="button" className="icon-btn sb-mobilebar-btn" onClick={onMenu} aria-label="Menüyü aç">
        <Menu size={21} />
      </button>
      <button type="button" className="sb-mobilebar-logo" onClick={() => setView('home')} aria-label="Koza — Ana Sayfa">
        <Brand compact />
      </button>
      <button
        type="button"
        className="icon-btn sb-mobilebar-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Gündüz moduna geç' : 'Gece moduna geç'}
      >
        <ThemeIcon theme={theme} size={19} />
      </button>
    </header>
  );
}

/* ------------------------------------------------------------------ */

function AddListForm({ onSubmit, id }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('lavender');
  const clean = name.trim();
  return (
    <form
      id={id}
      className="sb-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (clean) onSubmit({ name: clean, color });
      }}
    >
      <label className="field">
        <span className="field-label">Liste adı</span>
        <input
          className="input"
          value={name}
          maxLength={32}
          onChange={(e) => setName(e.target.value)}
          placeholder="ör. Kitaplar, Ev işleri…"
          required
        />
      </label>
      <fieldset className="sb-swatches">
        <legend className="field-label">Renk</legend>
        <div className="sb-swatch-row">
          {PALETTE.map((c) => (
            <label key={c.id} className="sb-swatch" data-color={c.id} title={c.label}>
              <input
                type="radio"
                name={`${id}-color`}
                value={c.id}
                checked={color === c.id}
                onChange={() => setColor(c.id)}
                className="sr-only"
              />
              <span className="sb-swatch-fill" aria-hidden="true" />
              <span className="sr-only">{c.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sb-preview" aria-hidden="true">
        <span className="faint">Önizleme</span>
        <span className="tag" data-color={color}>
          {clean || 'Yeni liste'}
        </span>
      </div>
    </form>
  );
}

function ProfileForm({ user, onSubmit, id }) {
  const [form, setForm] = useState(() => ({
    name: user.name || '',
    motto: user.motto || '',
    city: user.city || '',
    avatar: user.avatar || 'bruno',
  }));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form
      id={id}
      className="sb-form"
      onSubmit={(e) => {
        e.preventDefault();
        const city = form.city.trim();
        // a typed city replaces coordinates from "Konumumu kullan"
        const moved = city !== (user.city || '');
        onSubmit({ name: form.name.trim(), motto: form.motto.trim(), city, avatar: form.avatar, ...(moved ? { lat: null, lon: null } : {}) });
      }}
    >
      <div className="sb-profile-hero">
        <BearAvatar size={64} variant={form.avatar} />
        <p className="hand">merhaba {form.name.trim() || 'sen'} ♡</p>
      </div>
      <AvatarPicker value={form.avatar} onChange={(avatar) => setForm((f) => ({ ...f, avatar }))} />
      <label className="field">
        <span className="field-label">Adın</span>
        <input className="input" value={form.name} maxLength={24} onChange={set('name')} required />
      </label>
      <label className="field">
        <span className="field-label">Motton</span>
        <input className="input" value={form.motto} maxLength={48} onChange={set('motto')} placeholder="daha iyi bir sen ♡" />
      </label>
      <label className="field">
        <span className="field-label">Şehir (hava durumu için)</span>
        <input className="input" value={form.city} maxLength={40} onChange={set('city')} placeholder="ör. İzmir" />
      </label>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function UserCard() {
  const { user, updateUser, theme, toggleTheme, resetAll } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'profile' | 'reset' | null
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    requestAnimationFrame(() => wrapRef.current?.querySelector('.sb-menu button')?.focus());
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [menuOpen]);

  const open = (which) => {
    setMenuOpen(false);
    setModal(which);
  };

  return (
    <div className="sb-user" ref={wrapRef}>
      {menuOpen && (
        <div className="sb-menu" id="sb-user-menu">
          <button type="button" className="sb-menu-item" onClick={() => open('profile')}>
            <UserPen size={17} /> Profili düzenle
          </button>
          <button
            type="button"
            className="sb-menu-item"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={toggleTheme}
          >
            <ThemeIcon theme={theme} size={17} />
            Gece modu
            <span className="sb-switch" aria-hidden="true" />
          </button>
          <div className="sb-menu-sep" />
          <button type="button" className="sb-menu-item sb-menu-item--danger" onClick={() => open('reset')}>
            <RotateCcw size={17} /> Verileri sıfırla
          </button>
        </div>
      )}

      <button
        type="button"
        ref={triggerRef}
        className={`sb-user-btn${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-controls="sb-user-menu"
        aria-label={`Profil menüsü: ${user.name || 'Profilin'}`}
      >
        <span className="sb-avatar">
          <BearAvatar size={44} variant={user.avatar} />
        </span>
        <span className="sb-user-text">
          <span className="sb-user-name">{user.name || 'Profilin'}</span>
          {user.motto && <span className="sb-user-motto">{user.motto}</span>}
        </span>
        <ChevronsUpDown size={16} className="sb-user-chev" aria-hidden="true" />
      </button>

      <Modal
        open={modal === 'profile'}
        title="Profili düzenle"
        onClose={() => setModal(null)}
        width={420}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
              Vazgeç
            </button>
            <button type="submit" form="sb-profile-form" className="btn btn-primary">
              Kaydet
            </button>
          </>
        }
      >
        <ProfileForm
          id="sb-profile-form"
          user={user}
          onSubmit={(patch) => {
            updateUser(patch);
            setModal(null);
          }}
        />
      </Modal>

      <Modal
        open={modal === 'reset'}
        title="Verileri sıfırla"
        onClose={() => setModal(null)}
        width={400}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
              Vazgeç
            </button>
            <button type="button" className="btn btn-accent" onClick={resetAll}>
              <RotateCcw size={16} /> Sıfırla
            </button>
          </>
        }
      >
        <p className="sb-confirm-text">
          Tüm görevler, listeler, notlar ve alışkanlıklar silinip örnek verilere dönülecek. Bu işlem geri alınamaz.
        </p>
        <p className="hand sb-confirm-hand">temiz bir sayfa da güzeldir ♡</p>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Sidebar({ open = false, onClose }) {
  const { view, setView, todos, today, lists, addList, deleteList } = useApp();
  const [activeList, setActiveList] = useState(readFilter);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const asideRef = useRef(null);

  // keep highlighted list in sync with TasksPage (which may also dispatch the event)
  useEffect(() => {
    const onFilter = (e) => setActiveList(e.detail || ALL);
    window.addEventListener(FILTER_EVENT, onFilter);
    return () => window.removeEventListener(FILTER_EVENT, onFilter);
  }, []);

  // drawer: Escape closes, lock page scroll, move focus in and back out
  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => asideRef.current?.querySelector('.sb-close')?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus instanceof HTMLElement) prevFocus.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  const counts = useMemo(() => {
    const byList = {};
    let all = 0;
    let todayOpen = 0;
    let archived = 0;
    for (const t of todos) {
      if (t.archived) {
        archived += 1;
        continue;
      }
      all += 1;
      byList[t.listId] = (byList[t.listId] || 0) + 1;
      if (t.date === today && !t.completed) todayOpen += 1;
    }
    return { all, byList, todayOpen, archived };
  }, [todos, today]);

  const badges = { tasks: counts.todayOpen, archive: counts.archived };

  const go = (id) => {
    setView(id);
    onClose?.();
  };

  const syncFilter = (listId) => {
    try {
      sessionStorage.setItem(FILTER_KEY, listId);
    } catch {
      /* ignore */
    }
    setActiveList(listId);
    window.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: listId }));
  };

  const pickList = (listId) => {
    syncFilter(listId);
    go('tasks');
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (activeList === pendingDelete.id) syncFilter(ALL);
    deleteList(pendingDelete.id);
    setPendingDelete(null);
  };

  const canDelete = (l) => lists.length > 1 && l.id !== 'kisisel';
  const listsActive = view === 'tasks';

  return (
    <>
      <div className={`sb-backdrop${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside ref={asideRef} className={`sb${open ? ' is-open' : ''}`} aria-label="Kenar menüsü">
        <div className="sb-scroll scroll-thin">
          <div className="sb-head">
            <button type="button" className="sb-logo" onClick={() => go('home')} aria-label="Koza — Ana Sayfa">
              <Brand />
            </button>
            <button type="button" className="icon-btn sb-close" onClick={onClose} aria-label="Menüyü kapat">
              <X size={19} />
            </button>
          </div>

          <nav className="sb-nav" aria-label="Sayfalar">
            <ul>
              {NAV.map(({ id, label, icon: NavIcon }) => {
                const active = view === id;
                const badge = badges[id];
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`sb-link${active ? ' is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => go(id)}
                    >
                      <NavIcon size={20} strokeWidth={1.9} className="sb-link-icon" aria-hidden="true" />
                      <span className="sb-link-label">{label}</span>
                      {badge > 0 && (
                        <span className={`sb-badge${id === 'archive' ? ' sb-badge--quiet' : ''}`}>
                          {badge}
                          <span className="sr-only">{id === 'tasks' ? ' bugün açık görev' : ' arşivlenmiş görev'}</span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section className="sb-lists" aria-labelledby="sb-lists-title">
            <div className="sb-section-head">
              <h2 id="sb-lists-title">Listelerim</h2>
              <button type="button" className="icon-btn sb-add" onClick={() => setAddOpen(true)} aria-label="Yeni liste ekle">
                <Plus size={18} />
              </button>
            </div>
            <ul>
              <li>
                <button
                  type="button"
                  className={`sb-list${listsActive && activeList === ALL ? ' is-active' : ''}`}
                  onClick={() => pickList(ALL)}
                >
                  <span className="sb-list-dot sb-list-dot--all" aria-hidden="true" />
                  <span className="sb-list-name">Tümü</span>
                  <span className="sb-list-count">{counts.all}</span>
                </button>
              </li>
              {lists.map((l) => (
                <li key={l.id} className={`sb-list-row${canDelete(l) ? ' sb-has-del' : ''}`}>
                  <button
                    type="button"
                    className={`sb-list${listsActive && activeList === l.id ? ' is-active' : ''}`}
                    onClick={() => pickList(l.id)}
                    data-color={l.color}
                  >
                    <span className="dot sb-list-dot" aria-hidden="true" />
                    <span className="sb-list-name">{l.name}</span>
                    <span className="sb-list-count">{counts.byList[l.id] || 0}</span>
                  </button>
                  {canDelete(l) && (
                    <button
                      type="button"
                      className="sb-list-del"
                      onClick={() => setPendingDelete(l)}
                      aria-label={`${l.name} listesini sil`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <div className="sb-spacer" />
          <UserCard />
        </div>
      </aside>

      <Modal
        open={addOpen}
        title="Yeni liste"
        onClose={() => setAddOpen(false)}
        width={420}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" form="sb-add-list" className="btn btn-primary">
              <Plus size={16} /> Ekle
            </button>
          </>
        }
      >
        <AddListForm
          id="sb-add-list"
          onSubmit={(data) => {
            addList(data);
            setAddOpen(false);
          }}
        />
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        title="Listeyi sil"
        onClose={() => setPendingDelete(null)}
        width={400}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setPendingDelete(null)}>
              Vazgeç
            </button>
            <button type="button" className="btn btn-accent" onClick={confirmDelete}>
              Sil
            </button>
          </>
        }
      >
        {pendingDelete && (
          <p className="sb-confirm-text">
            <span className="tag" data-color={pendingDelete.color}>
              {pendingDelete.name}
            </span>{' '}
            listesi silinecek. İçindeki {counts.byList[pendingDelete.id] || 0} görev <strong>Kişisel</strong> listesine
            taşınır.
          </p>
        )}
      </Modal>
    </>
  );
}

export default Sidebar;
