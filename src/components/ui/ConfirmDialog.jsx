import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

/** Destructive-action confirmation. */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="fs-row fs-gap-12" style={{ alignItems: 'flex-start' }}>
        <span
          className="fs-stat-icon"
          style={{
            '--icon-color': 'var(--rose)',
            background: 'rgba(244,63,94,0.12)',
            borderColor: 'rgba(244,63,94,0.3)',
            width: 40,
            height: 40,
          }}
        >
          <AlertTriangle size={18} />
        </span>
        <p className="fs-sm" style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}
