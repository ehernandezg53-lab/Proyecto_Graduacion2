import React from 'react';
import { Layers, X, PlusCircle } from 'lucide-react';

export const ModalNuevoCodigoRollo = ({
  isOpen,
  onClose,
  newRolloCodeForm,
  setNewRolloCodeForm,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} style={{ color: 'var(--yellow)' }} />
            Registrar Código de Alambre
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* 1. Código del Alambre */}
          <div className="form-group">
            <label className="form-label">Código del Alambre / Rollo</label>
            <input
              type="text"
              className="form-input"
              value={newRolloCodeForm.codigo}
              onChange={(e) => setNewRolloCodeForm({ ...newRolloCodeForm, codigo: e.target.value })}
              required
              style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Código identificador único para este tipo de alambre</span>
          </div>

          {/* 2. Tipo / Descripción del Rollo (Editable) */}
          <div className="form-group">
            <label className="form-label">Tipo / Descripción del Rollo</label>
            <input
              type="text"
              className="form-input"
              value={newRolloCodeForm.nombre}
              onChange={(e) => setNewRolloCodeForm({ ...newRolloCodeForm, nombre: e.target.value })}
              required
              style={{ paddingLeft: '0.6rem', color: 'var(--white)' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Escribe la descripción o especificación del alambre</span>
          </div>

          {/* 3. Peso Estándar Unitario (kg) */}
          <div className="form-group">
            <label className="form-label">Peso Estándar por Rollo (kg)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              className="form-input"
              placeholder="50.0"
              value={newRolloCodeForm.peso_estandar_kg}
              onChange={(e) => setNewRolloCodeForm({ ...newRolloCodeForm, peso_estandar_kg: parseFloat(e.target.value) || 0 })}
              required
              style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--white)' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Peso promedio predeterminado en kilogramos</span>
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
              style={{ flex: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={16} />
              Crear Código
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
