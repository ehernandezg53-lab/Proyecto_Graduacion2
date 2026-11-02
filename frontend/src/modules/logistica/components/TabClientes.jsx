import React from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';

export const TabClientes = ({
  searchTerm,
  setSearchTerm,
  loading,
  clientes,
  onEditCliente,
  onDeleteCliente
}) => {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>Catálogo General de Clientes</h3>
        <div className="input-container" style={{ width: '320px', maxWidth: '100%' }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por número o nombre de cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.75rem' }}>Número de Cliente</th>
              <th style={{ padding: '0.75rem' }}>Nombre / Empresa</th>
              <th style={{ padding: '0.75rem' }}>Dirección Pre-establecida</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Cargando catálogo de clientes...
                </td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay clientes registrados en el sistema.
                </td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id_cliente} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                    {c.numero_cliente}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                    {c.nombre}
                  </td>
                  <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                    {c.direccion || 'Sin dirección registrada'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.5rem' }}
                        onClick={() => onEditCliente(c)}
                        title="Editar Cliente"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                        onClick={() => onDeleteCliente(c.id_cliente)}
                        title="Eliminar Cliente"
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
