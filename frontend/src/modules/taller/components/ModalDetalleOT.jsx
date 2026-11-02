import React from 'react';
import { X, PackageCheck, CheckCircle2 } from 'lucide-react';

export const ModalDetalleOT = ({
  isOpen,
  onClose,
  ot,
  onCerrarOrden,
  setConfirmDialog
}) => {
  if (!isOpen || !ot) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--yellow)' }}>
                Orden de Trabajo: {ot.numero_orden}
              </h2>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor:
                    (ot.estado === 'Cerrada' || ot.estado === 'Finalizada') ? '#ecfdf5' : '#eff6ff',
                  color:
                    (ot.estado === 'Cerrada' || ot.estado === 'Finalizada') ? '#059669' : '#1e40af',
                  border: `1px solid ${
                    (ot.estado === 'Cerrada' || ot.estado === 'Finalizada') ? '#a7f3d0' : '#bfdbfe'
                  }`
                }}
              >
                {ot.estado}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Registrado el {new Date(ot.fecha_creacion).toLocaleString()}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-element)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Vehículo</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
              {ot.vehiculo_detail ? `${ot.vehiculo_detail.placa} (${ot.vehiculo_detail.modelo || 'Sin modelo'})` : 'No asignado'}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Mecánico Asignado</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
              {ot.mecanico_detail ? ot.mecanico_detail.nombre : (ot.mecanico_asignado || 'No Asignado')}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Área / Especialidad</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
              {ot.mecanico_detail ? ot.mecanico_detail.area : (ot.area_asignada || 'General')}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Costo Acumulado Repuestos</span>
            <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>
              Q {Number(ot.total_repuestos_q || 0).toFixed(2)}
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
            Descripción del Mantenimiento / Trabajo
          </label>
          <div style={{ backgroundColor: 'var(--bg-element)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.88rem', color: 'var(--white)', border: '1px solid var(--border)', minHeight: '50px' }}>
            {ot.descripcion || 'Sin descripción detallada.'}
          </div>
        </div>

        {/* SECCIÓN DE SALIDA DE REPUESTOS RELACIONADOS */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PackageCheck size={18} style={{ color: 'var(--yellow)' }} />
              Repuestos Entregados desde Bodega
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {ot.salidas_repuesto?.length || 0} registro(s)
            </span>
          </div>

          {(!ot.salidas_repuesto || ot.salidas_repuesto.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--bg-element)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No se han registrado salidas de repuestos desde Bodega para esta Orden de Trabajo.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem' }}>Repuesto</th>
                    <th style={{ padding: '0.6rem' }}>Código</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>Cant.</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>P. Unit Q</th>
                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>Subtotal Q</th>
                    <th style={{ padding: '0.6rem' }}>Fecha Despacho</th>
                  </tr>
                </thead>
                <tbody>
                  {ot.salidas_repuesto.map((salida) => {
                    const subtotal = Number(salida.cantidad * (salida.precio_unitario || 0));
                    return (
                      <tr key={salida.id_salida} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--white)' }}>
                          {salida.repuesto_nombre}
                        </td>
                        <td style={{ padding: '0.6rem', color: 'var(--yellow)', fontWeight: 600 }}>
                          {salida.repuesto_codigo || 'N/A'}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700, color: 'var(--white)' }}>
                          {salida.cantidad}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                          Q {Number(salida.precio_unitario || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                          Q {subtotal.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {new Date(salida.fecha).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: ot.estado === 'Cerrada' ? 'flex-end' : 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {ot.estado !== 'Cerrada' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Acciones:</span>
              <button
                className="btn-secondary"
                onClick={() => {
                  setConfirmDialog({
                    title: "Cerrar Orden de Trabajo",
                    message: "¿Está seguro de cerrar esta Orden de Trabajo? Una vez cerrada, esta no podrá volver a ser abierta.",
                    confirmText: "Cerrar Orden",
                    confirmColor: "var(--success)",
                    onConfirm: () => onCerrarOrden(ot.id_orden)
                  });
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--success)',
                  borderColor: '#a7f3d0',
                  backgroundColor: '#ecfdf5',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 size={15} />
                Cerrar Orden
              </button>
            </div>
          )}

          <button
            className="btn-secondary"
            onClick={onClose}
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
