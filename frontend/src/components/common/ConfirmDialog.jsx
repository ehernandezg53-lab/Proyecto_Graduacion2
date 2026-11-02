import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ConfirmDialog = ({ dialog, onCancel }) => {
  if (!dialog) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 10001 }}>
      <div className="modal-content" style={{ maxWidth: '420px', width: '92%', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            backgroundColor: dialog.confirmColor === 'var(--danger)' ? '#fee2e2' : '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: dialog.confirmColor === 'var(--danger)' ? 'var(--danger)' : 'var(--blue)',
            flexShrink: 0
          }}>
            <AlertCircle size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--white)' }}>
            {dialog.title}
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.35rem', lineHeight: 1.5 }}>
          {dialog.message}
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{
              flex: 1,
              backgroundColor: dialog.confirmColor || 'var(--blue)',
              borderColor: 'transparent'
            }}
            onClick={async () => {
              const action = dialog.onConfirm;
              onCancel();
              if (action) await action();
            }}
          >
            {dialog.confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
