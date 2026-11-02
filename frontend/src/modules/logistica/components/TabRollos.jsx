import React from 'react';
import { Search, Boxes, Trash2 } from 'lucide-react';

export const TabRollos = ({
  rolloFilterEstado,
  setRolloFilterEstado,
  rolloSearch,
  setRolloSearch,
  loading,
  rollos,
  onDeleteRollo
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Tabla de Inventario de Rollos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
              Inventario y Trazabilidad de Rollos de Alambre
            </h3>
            {/* Selector de filtro por estado */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['Todos', 'Disponible', 'En Viaje', 'Entregado'].map((est) => (
                <button
                  key={est}
                  onClick={() => setRolloFilterEstado(est)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '14px',
                    border: rolloFilterEstado === est ? '1px solid #bfdbfe' : '1px solid var(--border)',
                    backgroundColor: rolloFilterEstado === est ? '#1e40af' : 'transparent',
                    color: rolloFilterEstado === est ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {est}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="input-container" style={{ width: '280px' }}>
              <Search className="input-icon" size={15} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por código o tipo..."
                value={rolloSearch}
                onChange={(e) => setRolloSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>Código Rollo</th>
                <th style={{ padding: '0.75rem' }}>Tipo de Alambre</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Peso (kg)</th>
                <th style={{ padding: '0.75rem' }}>Ubicación en Bodega</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '0.75rem' }}>Viaje Asignado / Destino</th>
                <th style={{ padding: '0.75rem' }}>Fecha de Ingreso</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Cargando inventario de rollos...
                  </td>
                </tr>
              ) : rollos.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Boxes size={32} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                      <span>No se encontraron rollos de alambre en este criterio de búsqueda.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rollos.map((r) => {
                  let badgeStyle = { backgroundColor: '#dcfce7', color: '#15803d' };
                  if (r.estado === 'En Viaje') badgeStyle = { backgroundColor: '#fef3c7', color: '#b45309' };
                  else if (r.estado === 'Entregado') badgeStyle = { backgroundColor: '#dbeafe', color: '#1e40af' };

                  return (
                    <tr key={r.id_rollo} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                        {r.codigo_rollo}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                        {r.tipo_alambre}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--white)', padding: '0.75rem' }}>
                        {Number(r.peso_kg || 0).toFixed(2)} kg
                      </td>
                      <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                        {r.ubicacion || 'Bodega Central'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <span style={{ ...badgeStyle, padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                          {r.estado}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {r.viaje_numero ? (
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--blue)' }}>Viaje #{r.viaje_numero}</span>
                            {r.cliente_nombre && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Cliente: {r.cliente_nombre}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            En Bodega (Sin Asignar)
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', padding: '0.75rem', fontSize: '0.82rem' }}>
                        {r.fecha_ingreso ? new Date(r.fecha_ingreso).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        {r.estado === 'Disponible' ? (
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                            onClick={() => onDeleteRollo(r.id_rollo, r.codigo_rollo)}
                            title="Eliminar Rollo del Inventario"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Bloqueado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
