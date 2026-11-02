import React from 'react';
import { Truck, X } from 'lucide-react';

export const ModalVehiculo = ({
  isOpen,
  onClose,
  vehiculoForm,
  setVehiculoForm,
  editingVehiculoId,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} style={{ color: 'var(--blue)' }} />
            {editingVehiculoId ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
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
            <label className="form-label">Unidad</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '0.6rem' }}
              value={vehiculoForm.unidad}
              onChange={(e) => setVehiculoForm({ ...vehiculoForm, unidad: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Placa</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
              value={vehiculoForm.placa}
              onChange={(e) => setVehiculoForm({ ...vehiculoForm, placa: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estado de la Unidad</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.4rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--white)' }}>
                <input
                  type="radio"
                  name="vehiculoActivo"
                  checked={vehiculoForm.activo === true}
                  onChange={() => setVehiculoForm({ ...vehiculoForm, activo: true })}
                />
                Activo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--white)' }}>
                <input
                  type="radio"
                  name="vehiculoActivo"
                  checked={vehiculoForm.activo === false}
                  onChange={() => setVehiculoForm({ ...vehiculoForm, activo: false })}
                />
                Inactivo
              </label>
            </div>
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
              {editingVehiculoId ? 'Guardar Cambios' : 'Guardar Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
