import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

/**
 * Shared dialog. Closes on Escape and backdrop click.
 * <Modal open title="Görev Ekle" onClose={...} footer={<button/>}>...</Modal>
 */
function Modal({ open, title, onClose, children, footer, width = 460 }) {
  const panelRef = useRef(null);
  // keep latest onClose without re-running the open effect (which refocuses the first field)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current?.();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // focus the first text field, falling back to the first button
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      (panel?.querySelector('input, textarea, select') || panel?.querySelector('button:not(.modal-close)'))?.focus();
    });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label={title} ref={panelRef} style={{ maxWidth: width }}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
