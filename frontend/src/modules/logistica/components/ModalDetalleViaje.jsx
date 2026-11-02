import React from 'react';
import { Truck, X, Layers, CheckCircle2 } from 'lucide-react';

export const ModalDetalleViaje = ({
  isOpen,
  onClose,
  viaje,
  onCompletarEntrega,
  setConfirmDialog
}) => {
  if (!isOpen || !viaje) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} style={{ color: 'var(--blue)' }} />
            Detalle del Viaje #{viaje.numero_viaje}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>1. Fecha del Envío</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
              {viaje.fecha_envio ? new Date(viaje.fecha_envio + 'T00:00:00').toLocaleDateString() : '—'}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>2. Hora del Envío</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
              {viaje.hora_envio || '—'}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>3. Unidad</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--yellow)' }}>
              {viaje.vehiculo_detail ? `${viaje.vehiculo_detail.placa} (${viaje.vehiculo_detail.unidad || viaje.vehiculo_detail.modelo || 'Unidad'})` : 'Sin unidad'}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>4. Conductor Asignado</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
              {viaje.conductor_detail ? viaje.conductor_detail.nombre : 'Sin conductor asignado'}
            </strong>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-element)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
            Cliente y Dirección de Destino:
          </span>
          <div style={{ fontSize: '0.92rem', color: 'var(--white)', fontWeight: 700, marginBottom: '0.25rem' }}>
            {viaje.cliente_detail?.numero_cliente || 'N/A'} - {viaje.cliente_detail?.nombre || ''}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {viaje.cliente_detail?.direccion || 'Sin dirección registrada.'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>5. Peso de la Carga</span>
            <strong style={{ fontSize: '1rem', color: 'var(--white)' }}>
              {Number(viaje.peso_carga_kg || 0).toLocaleString()} kg
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>6. Volumen (Rollos Asignados)</span>
            <strong style={{ fontSize: '1rem', color: 'var(--blue)' }}>
              {viaje.cantidad_rollos || (viaje.rollos_detail ? viaje.rollos_detail.length : 0)} rollos
            </strong>
          </div>
        </div>

        {/* Listado de Rollos Asignados */}
        <div style={{ marginTop: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ padding: '0.65rem 0.9rem', backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={15} style={{ color: 'var(--yellow)' }} />
              Rollos Asignados a la Carga ({viaje.rollos_detail?.length || 0})
            </span>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '12px',
              fontWeight: 700,
              backgroundColor: viaje.estado === 'Cerrada' ? '#dcfce7' : '#fef3c7',
              color: viaje.estado === 'Cerrada' ? '#15803d' : '#b45309'
            }}>
              {viaje.estado === 'Cerrada' ? 'Viaje Entregado y Cerrado' : `Estado: ${viaje.estado || 'Abierta'}`}
            </span>
          </div>

          <div style={{ maxHeight: '170px', overflowY: 'auto' }}>
            {(!viaje.rollos_detail || viaje.rollos_detail.length === 0) ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No hay rollos físicos individuales vinculados a este viaje.
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.45rem 0.75rem' }}>Código Rollo</th>
                    <th style={{ padding: '0.45rem 0.75rem' }}>Tipo de Alambre</th>
                    <th style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>Peso</th>
                    <th style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>Estado Rollo</th>
                  </tr>
                </thead>
                <tbody>
                  {viaje.rollos_detail.map((rd) => (
                    <tr key={rd.id_rollo} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.45rem 0.75rem', fontWeight: 700, color: 'var(--yellow)' }}>
                        {rd.codigo_rollo}
                      </td>
                      <td style={{ padding: '0.45rem 0.75rem', color: 'var(--white)' }}>
                        {rd.tipo_alambre}
                      </td>
                      <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--white)' }}>
                        {rd.peso_kg} kg
                      </td>
                      <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '10px',
                          backgroundColor: rd.estado === 'Entregado' ? '#dcfce7' : '#fef3c7',
                          color: rd.estado === 'Entregado' ? '#15803d' : '#b45309',
                          fontWeight: 700
                        }}>
                          {rd.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            {viaje.estado !== 'Cerrada' && (
              <button
                className="btn-primary"
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                onClick={() => {
                  setConfirmDialog({
                    title: "Completar Entrega",
                    message: "¿Desea marcar este viaje como ENTREGADO y CERRADO? Los rollos asignados se actualizarán a estado 'Entregado'.",
                    confirmText: "Completar Entrega",
                    confirmColor: "#16a34a",
                    onConfirm: async () => {
                      await onCompletarEntrega(viaje.id_viaje);
                    }
                  });
                }}
              >
                <CheckCircle2 size={15} /> Completar Entrega (Cerrar Viaje)
              </button>
            )}
          </div>

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
