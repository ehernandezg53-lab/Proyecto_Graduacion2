import React from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { CustomSelect } from '@/components/common';

export const ModalSalidaRepuesto = ({
  isOpen,
  onClose,
  salidaForm,
  setSalidaForm,
  ordenesTrabajo,
  repuestos,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpRight size={18} style={{ color: 'var(--danger)' }} />
            Registrar Salida de Repuesto
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Orden de Trabajo</label>
            <CustomSelect
              options={[
                { value: '', label: 'Seleccionar Orden de Trabajo...' },
                ...ordenesTrabajo.map(ot => {
                  const desc = ot.descripcion ? (ot.descripcion.length > 45 ? ot.descripcion.substring(0, 42) + '...' : ot.descripcion) : 'Sin descripción';
                  const placaInfo = ot.vehiculo_detail?.placa ? ` (${ot.vehiculo_detail.placa})` : '';
                  const isClosed = ot.estado === 'Cerrada';
                  return {
                    value: ot.id_orden,
                    label: `#${ot.numero_orden}${placaInfo} — ${desc}${isClosed ? ' [CERRADA]' : ''}`,
                    disabled: isClosed
                  };
                })
              ]}
              value={salidaForm.orden_trabajo}
              onChange={(e) => setSalidaForm({ ...salidaForm, orden_trabajo: e.target.value })}
              placeholder="Seleccionar Orden de Trabajo..."
              required
              maxHeight={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Repuesto</label>
            <CustomSelect
              options={[
                { value: '', label: 'Seleccionar Repuesto...' },
                ...repuestos.map(r => ({
                  value: r.id_repuesto,
                  label: `[${r.codigo || r.id_repuesto}] — ${r.nombre} (Disponible: ${r.stock})${r.stock <= 0 ? ' - AGOTADO' : ''}`,
                  disabled: r.stock <= 0
                }))
              ]}
              value={salidaForm.repuesto}
              onChange={(e) => setSalidaForm({ ...salidaForm, repuesto: e.target.value })}
              placeholder="Seleccionar Repuesto..."
              required
              maxHeight={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cantidad a Despachar</label>
            <input
              type="number"
              min="1"
              className="form-input"
              style={{ paddingLeft: '0.6rem' }}
              value={salidaForm.cantidad}
              onChange={(e) => setSalidaForm({ ...salidaForm, cantidad: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observación / Notas</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '0.6rem' }}
              value={salidaForm.observacion}
              onChange={(e) => setSalidaForm({ ...salidaForm, observacion: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'transparent' }}>
              Confirmar Salida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalSalidaRepuesto;
