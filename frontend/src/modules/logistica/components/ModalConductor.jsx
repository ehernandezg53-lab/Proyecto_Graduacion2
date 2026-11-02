import React from 'react';
import { Users, X } from 'lucide-react';

export const ModalConductor = ({
  isOpen,
  onClose,
  conductorForm,
  setConductorForm,
  editingConductorId,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} style={{ color: 'var(--blue)' }} />
            {editingConductorId ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Código de Carnet (6 dígitos)</label>
            <input
              type="text"
              maxLength={6}
              className="form-input"
              style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.05em' }}
              value={conductorForm.codigo_carnet}
              onChange={(e) => setConductorForm({ ...conductorForm, codigo_carnet: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nombre Completo del Conductor</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '0.6rem' }}
              value={conductorForm.nombre}
              onChange={(e) => setConductorForm({ ...conductorForm, nombre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Caducidad del Número de Licencia</label>
            <input
              type="date"
              className="form-input"
              style={{ paddingLeft: '0.6rem' }}
              value={conductorForm.fecha_vencimiento_licencia}
              onChange={(e) => setConductorForm({ ...conductorForm, fecha_vencimiento_licencia: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
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
            >
              {editingConductorId ? 'Guardar Cambios' : 'Guardar Conductor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
