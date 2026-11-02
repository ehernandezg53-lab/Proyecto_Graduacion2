import React from 'react';
import { ArrowDownRight, X, Check } from 'lucide-react';

export const ModalResumenOrden = ({ orden, onClose, onProcesarIngreso }) => {
  if (!orden) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowDownRight size={18} style={{ color: 'var(--success)' }} />
              Resumen de Orden de Ingreso #{orden.numero_orden}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Detalles del proveedor, repuesto y cantidades
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Datos Principales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', backgroundColor: 'var(--bg-element)', padding: '0.85rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Proveedor
            </span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
              {orden.proveedor}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              N° Orden Correlativo
            </span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--yellow)' }}>
              #{orden.numero_orden}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Generada Por
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {orden.creado_por_nombre}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
              Estado de Ingreso
            </span>
            <span style={{ fontSize: '0.85rem', color: orden.estado === 'Ingresado' ? 'var(--success)' : 'var(--yellow)', fontWeight: 600 }}>
              {orden.estado === 'Ingresado' ? `Ingresado por ${orden.ingresado_por_nombre}` : 'Pendiente de Ingreso'}
            </span>
          </div>
        </div>

        {orden.observaciones && (
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Observaciones:</strong> {orden.observaciones}
          </div>
        )}

        {/* Tabla con el Detalle del Repuesto y la Cantidad */}
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--white)' }}>
          Repuestos de la Orden de Ingreso:
        </h4>
        <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
          <table className="custom-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Repuesto</th>
                <th>Descripción del Repuesto</th>
                <th style={{ textAlign: 'center' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Precio Unit. (Q)</th>
              </tr>
            </thead>
            <tbody>
              {orden.detalles && orden.detalles.length > 0 ? (
                orden.detalles.map((det, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>{det.repuesto_nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{det.descripcion_repuesto}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>+{det.cantidad}</td>
                    <td style={{ textAlign: 'right' }}>Q{Number(det.precio_unitario || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    Sin detalle de repuestos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={onClose}>
            Cerrar Resumen
          </button>

          {orden.estado === 'Pendiente' && (
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.8rem', backgroundColor: 'var(--success)', borderColor: 'transparent' }}
              onClick={() => onProcesarIngreso(orden.id_orden_ingreso)}
            >
              <Check size={14} /> Ingresar Repuestos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalResumenOrden;
