import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ellipsis } from 'lucide-react';
import './tasks.css';

const MENU_W = 196;

/**
 * "⋯" popover menu. Rendered in a portal with fixed positioning so it is never
 * clipped by scrolling containers. Escape / outside click / scroll closes it.
 * items: [{ label, icon: LucideIcon, onSelect, danger? }]
 */
function TaskMenu({ items, label = 'Görev seçenekleri' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  const toggle = () => {
    if (open) return close();
    const r = btnRef.current.getBoundingClientRect();
    const estH = items.length * 40 + 12;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    const goUp = r.bottom + estH + 8 > window.innerHeight && r.top > estH + 8;
    setPos(goUp ? { left, bottom: window.innerHeight - r.top + 6 } : { left, top: r.bottom + 6 });
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (open) menuRef.current?.querySelector('[role="menuitem"]')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(true);
      }
    };
    const onScroll = (e) => {
      if (!menuRef.current?.contains(e.target)) close();
    };
    const onResize = () => close();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  const onMenuKey = (e) => {
    const els = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const i = els.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      els[(i + 1) % els.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      els[(i - 1 + els.length) % els.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      els[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      els[els.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      close();
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`icon-btn task-menu-btn${open ? ' is-open' : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <Ellipsis size={18} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="task-menu"
            role="menu"
            aria-label={label}
            style={{ ...pos, width: MENU_W }}
            onKeyDown={onMenuKey}
          >
            {items.map(({ label: itemLabel, icon: ItemIcon, onSelect, danger }) => (
              <button
                key={itemLabel}
                type="button"
                role="menuitem"
                className={`task-menu-item${danger ? ' is-danger' : ''}`}
                onClick={() => {
                  close(true);
                  onSelect();
                }}
              >
                {ItemIcon && <ItemIcon size={16} aria-hidden="true" />}
                <span>{itemLabel}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export default TaskMenu;
