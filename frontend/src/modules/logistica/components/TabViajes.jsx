import React from 'react';
import { Search } from 'lucide-react';

export const TabViajes = ({
  progDesde,
  setProgDesde,
  hasta,
  setHasta,
  searchTerm,
  setSearchTerm,
  loading,
  viajes,
  selectedViajeId,
  setSelectedViajeId
}) => {
  return (
    <>
      {/* Barra Superior de Filtros por Rango de Fechas */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem' }}>Prog desde:</label>
            <input
              type="date"
              className="form-input"
              style={{ width: '150px', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
              value={progDesde}
              onChange={(e) => setProgDesde(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem' }}>Hasta:</label>
            <input
              type="date"
              className="form-input"
              style={{ width: '150px', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>

          {(progDesde || hasta) && (
            <button
              className="btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
              onClick={() => { setProgDesde(''); setHasta(''); }}
            >
              Limpiar Fechas
            </button>
          )}
        </div>

        <div className="input-container" style={{ width: '280px', maxWidth: '100%', minWidth: '200px' }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por N° viaje, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla Estructurada de Viajes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ width: '40px', textAlign: 'center', padding: '0.75rem' }}>✓</th>
                <th style={{ padding: '0.75rem' }}>N° Viaje</th>
                <th style={{ padding: '0.75rem' }}>Unidad</th>
                <th style={{ padding: '0.75rem' }}>Conductor</th>
                <th style={{ padding: '0.75rem' }}>N° de Cliente</th>
                <th style={{ padding: '0.75rem' }}>Nombre del Cliente</th>
                <th style={{ padding: '0.75rem' }}>Dirección Destino</th>
                <th style={{ padding: '0.75rem' }}>Fecha Programada</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Cargando consulta de viajes...
                  </td>
                </tr>
              ) : viajes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron registros de viajes en el rango seleccionado.
                  </td>
                </tr>
              ) : (
                viajes.map((v) => {
                  const isSelected = selectedViajeId === v.id_viaje;
                  return (
                    <tr
                      key={v.id_viaje}
                      style={{
                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)'
                      }}
                      onClick={() => setSelectedViajeId(isSelected ? null : v.id_viaje)}
                    >
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedViajeId(isSelected ? null : v.id_viaje)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                        #{v.numero_viaje}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                        {v.vehiculo_detail ? `${v.vehiculo_detail.placa} (${v.vehiculo_detail.unidad || v.vehiculo_detail.modelo || 'Unidad'})` : 'Sin unidad'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                        {v.conductor_detail ? v.conductor_detail.nombre : <span style={{ color: 'var(--text-muted)' }}>Sin conductor</span>}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                        {v.cliente_detail?.numero_cliente || 'N/A'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                        {v.cliente_detail?.nombre || 'Cliente sin nombre'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem', padding: '0.75rem' }}>
                        {v.cliente_detail?.direccion || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                        {v.fecha_envio ? new Date(v.fecha_envio + 'T00:00:00').toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
