import React from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';

export const ModalAutorizarPin = ({
  isOpen,
  onClose,
  solicitud,
  pinTemporalInput,
  setPinTemporalInput,
  authLoading,
  authError,
  onGenerarPin,
  onSubmit
}) => {
  if (!isOpen || !solicitud) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', width: '92%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <ShieldCheck size={20} style={{ color: 'var(--yellow)' }} />
            Autorizar Restablecimiento
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {authError && (
            <div className="alert-error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', padding: '0.6rem 0.75rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-element)', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ticket</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--yellow)', marginBottom: '0.5rem' }}>
              {solicitud.numero_ticket}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--white)', fontWeight: 600 }}>
              Usuario: {solicitud.usuario_nombre} {solicitud.usuario_apellido}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Cuenta: @{solicitud.usuario_username} ({solicitud.usuario_rol})
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ margin: 0 }}>PIN / Clave Temporal de Acceso</label>
              <button
                type="button"
                onClick={onGenerarPin}
                style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Regenerar PIN
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              className="form-input"
              style={{ paddingLeft: '0.6rem', fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 800, color: 'var(--yellow)', letterSpacing: '0.12em' }}
              value={pinTemporalInput}
              onChange={(e) => {
                const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPinTemporalInput(cleanVal);
              }}
              required
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              PIN únicamente numérico de 6 dígitos. El usuario usará esta clave para iniciar sesión y el sistema le exigirá cambiarla de inmediato.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1 }}
              disabled={authLoading}
            >
              {authLoading ? 'Autorizando...' : 'Autorizar y Generar Hoja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
