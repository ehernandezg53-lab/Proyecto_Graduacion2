import React from 'react';
import { UserPlus, X } from 'lucide-react';

export const ModalNuevoMecanico = ({
  isOpen,
  onClose,
  mecanicoForm,
  setMecanicoForm,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} style={{ color: 'var(--blue)' }} />
            Registrar Nuevo Mecánico de Taller
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
            <label className="form-label">Nombre Completo del Mecánico</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '0.6rem' }}
              value={mecanicoForm.nombre}
              onChange={(e) => setMecanicoForm({ ...mecanicoForm, nombre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Área de Especialidad</label>
            <select
              className="form-select"
              value={mecanicoForm.area}
              onChange={(e) => setMecanicoForm({ ...mecanicoForm, area: e.target.value })}
            >
              <option value="Soldadura">Soldadura</option>
              <option value="Electromecánico">Electromecánico</option>
              <option value="Tapicería">Tapicería</option>
              <option value="Llantero">Llantero</option>
              <option value="General">General</option>
            </select>
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
              Guardar Mecánico
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
