import React from 'react';
import { ArrowDownRight, X, PlusCircle } from 'lucide-react';

export const ModalNuevaOrden = ({
  isOpen,
  onClose,
  ingresoForm,
  setIngresoForm,
  repuestos,
  onSubmit,
  onAddDetailRow,
  onRemoveDetailRow,
  onDetailChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowDownRight size={18} style={{ color: 'var(--success)' }} />
            Generar Orden de Ingreso
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div className="form-group">
              <label className="form-label">Número de Orden Correlativo</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
                value={ingresoForm.numero_orden}
                onChange={(e) => setIngresoForm({ ...ingresoForm, numero_orden: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '0.6rem' }}
                value={ingresoForm.proveedor}
                onChange={(e) => setIngresoForm({ ...ingresoForm, proveedor: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones (Opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Detalles sobre el pedido..."
              style={{ paddingLeft: '0.6rem' }}
              value={ingresoForm.observaciones}
              onChange={(e) => setIngresoForm({ ...ingresoForm, observaciones: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-element)', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              id="proc_inm"
              checked={ingresoForm.procesar_inmediatamente}
              onChange={(e) => setIngresoForm({ ...ingresoForm, procesar_inmediatamente: e.target.checked })}
            />
            <label htmlFor="proc_inm" style={{ fontSize: '0.82rem', cursor: 'pointer', color: 'var(--white)', fontWeight: 600 }}>
              Ingresar repuestos a bodega inmediatamente al generar la orden
            </label>
          </div>

          <hr style={{ margin: '1rem 0', borderColor: 'var(--border)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Repuestos e Ítems de la Orden</label>
            <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }} onClick={onAddDetailRow}>
              <PlusCircle size={13} /> Añadir Repuesto
            </button>
          </div>

          {ingresoForm.detalles.map((det, idx) => (
            <div key={idx} style={{ backgroundColor: 'var(--bg-element)', padding: '0.65rem', borderRadius: 'var(--radius)', marginBottom: '0.5rem', border: '1px solid var(--border)' }}>
              <div className="modal-ingreso-item-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 0.8fr 0.8fr auto', gap: '0.4rem', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Repuesto</label>
                  <select
                    className="form-select"
                    style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                    value={det.repuesto}
                    onChange={(e) => onDetailChange(idx, 'repuesto', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {repuestos.map(r => (
                      <option key={r.id_repuesto} value={r.id_repuesto}>[{r.codigo || r.id_repuesto}] {r.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Descripción del Repuesto</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    placeholder="Descripción detallada..."
                    value={det.descripcion_repuesto}
                    onChange={(e) => onDetailChange(idx, 'descripcion_repuesto', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', textAlign: 'center' }}
                    value={det.cantidad}
                    onChange={(e) => onDetailChange(idx, 'cantidad', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Precio Unit. (Q)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', textAlign: 'right' }}
                    value={det.precio_unitario}
                    onChange={(e) => onDetailChange(idx, 'precio_unitario', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {ingresoForm.detalles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveDetailRow(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginTop: '1rem' }}
                    title="Quitar ítem"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Generar Orden de Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevaOrden;
