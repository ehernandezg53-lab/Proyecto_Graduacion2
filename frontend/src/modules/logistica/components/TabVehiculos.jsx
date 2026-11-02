import React from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';

export const TabVehiculos = ({
  searchTerm,
  setSearchTerm,
  loading,
  vehiculos,
  onEditVehiculo,
  onDeleteVehiculo
}) => {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>Catálogo de Vehículos (Camiones)</h3>
        <div className="input-container" style={{ width: '320px', maxWidth: '100%' }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por unidad o placa..."
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
              <th style={{ padding: '0.75rem' }}>Unidad</th>
              <th style={{ padding: '0.75rem' }}>Placa</th>
              <th style={{ padding: '0.75rem' }}>Estado</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Cargando catálogo de vehículos...
                </td>
              </tr>
            ) : vehiculos.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay vehículos registrados en el sistema.
                </td>
              </tr>
            ) : (
              vehiculos.map((v) => (
                <tr key={v.id_vehiculo} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>#{v.id_vehiculo}</td>
                  <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                    {v.unidad || v.modelo || 'Sin unidad especificada'}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                    {v.placa}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {v.activo !== false ? (
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                        Activo
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.5rem' }}
                        onClick={() => onEditVehiculo(v)}
                        title="Editar Vehículo"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                        onClick={() => onDeleteVehiculo(v.id_vehiculo)}
                        title="Eliminar Vehículo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
