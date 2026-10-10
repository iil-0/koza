import Modal from '../../components/Modal';
import './tasks.css';

/** Small cozy confirm dialog. props: open, title, message, confirmLabel, onConfirm, onClose */
function ConfirmDialog({ open, title, message, confirmLabel = 'Evet', onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      width={400}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button
            type="button"
            className="btn task-btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="task-confirm-msg">{message}</p>
    </Modal>
  );
}

export default ConfirmDialog;
