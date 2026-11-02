import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        borderRadius: '8px',
        backgroundColor: toast.type === 'success' ? '#15803d' : toast.type === 'error' ? '#b91c1c' : '#d97706',
        color: '#ffffff',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.15)',
        fontSize: '0.875rem',
        fontWeight: 500,
        maxWidth: '440px'
      }}
    >
      {toast.type === 'success' && <CheckCircle2 size={20} style={{ flexShrink: 0 }} />}
      {toast.type === 'error' && <AlertCircle size={20} style={{ flexShrink: 0 }} />}
      {toast.type === 'warning' && <AlertCircle size={20} style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.85
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastNotification;
