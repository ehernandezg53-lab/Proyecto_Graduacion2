import React from 'react';
import { Package, X } from 'lucide-react';

export const ModalNuevoRepuesto = ({
  isOpen,
  onClose,
  repuestoForm,
  setRepuestoForm,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} style={{ color: 'var(--yellow)' }} />
            Agregar Nuevo Repuesto al Catálogo
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.45rem' }}>Código</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem', fontWeight: 700, fontSize: '0.95rem', color: '#b45309', backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
              value={repuestoForm.codigo}
              onChange={(e) => setRepuestoForm({ ...repuestoForm, codigo: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.45rem' }}>Nombre del Repuesto</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem' }}
              value={repuestoForm.nombre}
              onChange={(e) => setRepuestoForm({ ...repuestoForm, nombre: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.45rem' }}>Descripción</label>
            <input
              type="text"
              className="form-input"
              placeholder="Especificaciones técnicas o compatibilidad con vehículos"
              style={{ padding: '0.65rem 0.85rem' }}
              value={repuestoForm.descripcion}
              onChange={(e) => setRepuestoForm({ ...repuestoForm, descripcion: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.45rem' }}>Precio Unitario (Q)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              style={{ padding: '0.65rem 0.85rem' }}
              value={repuestoForm.precio_unitario}
              onChange={(e) => setRepuestoForm({ ...repuestoForm, precio_unitario: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.7rem 1rem', fontSize: '0.9rem' }} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.7rem 1rem', fontSize: '0.9rem' }}>
              Guardar Repuesto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevoRepuesto;
