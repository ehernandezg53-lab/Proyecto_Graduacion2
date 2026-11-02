import React from 'react';
import { Search, Edit } from 'lucide-react';

export const TabConductores = ({
  searchTerm,
  setSearchTerm,
  loading,
  conductores,
  onEditConductor
}) => {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>Lista de Conductores y Caducidad de Licencias</h3>
        <div className="input-container" style={{ width: '360px', maxWidth: '100%' }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar conductor por nombre o código de carnet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.75rem' }}>ID</th>
              <th style={{ padding: '0.75rem' }}>Código de Carnet</th>
              <th style={{ padding: '0.75rem' }}>Nombre Completo del Conductor</th>
              <th style={{ padding: '0.75rem' }}>Caducidad del Número de Licencia</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Cargando lista de conductores...
                </td>
              </tr>
            ) : conductores.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay conductores registrados.
                </td>
              </tr>
            ) : (
              conductores.map((cond) => (
                <tr key={cond.id_conductor} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>#{cond.id_conductor}</td>
                  <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                    {cond.codigo_carnet || '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>{cond.nombre}</td>
                  <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                    {cond.fecha_vencimiento_licencia ? new Date(cond.fecha_vencimiento_licencia + 'T00:00:00').toLocaleDateString() : '—'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <button
                      className="btn-primary"
                      style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => onEditConductor(cond)}
                    >
                      <Edit size={13} /> Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
