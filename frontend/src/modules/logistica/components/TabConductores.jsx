import React, { useState } from 'react';
import { Search, Edit, UserX, UserCheck, Eye, EyeOff } from 'lucide-react';

export const TabConductores = ({
  searchTerm,
  setSearchTerm,
  loading,
  conductores,
  onEditConductor,
  onToggleBajaConductor
}) => {
  const [mostrarDadosDeBaja, setMostrarDadosDeBaja] = useState(false);

  const dadosDeBajaCount = conductores.filter(c => c.activo === false).length;
  const conductoresVisibles = conductores.filter(c => mostrarDadosDeBaja ? true : c.activo !== false);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>Lista de Conductores y Caducidad de Licencias</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {dadosDeBajaCount > 0 && (
            <button
              type="button"
              className="btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '0.4rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: mostrarDadosDeBaja ? 'var(--yellow)' : 'var(--text-muted)'
              }}
              onClick={() => setMostrarDadosDeBaja(!mostrarDadosDeBaja)}
              title={mostrarDadosDeBaja ? "Ocultar pilotos dados de baja" : "Ver pilotos dados de baja"}
            >
              {mostrarDadosDeBaja ? <EyeOff size={14} /> : <Eye size={14} />}
              {mostrarDadosDeBaja ? 'Ocultar dados de baja' : `Ver dados de baja (${dadosDeBajaCount})`}
            </button>
          )}
          <div className="input-container" style={{ width: '320px', maxWidth: '100%' }}>
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
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.75rem' }}>ID</th>
              <th style={{ padding: '0.75rem' }}>Código de Carnet</th>
              <th style={{ padding: '0.75rem' }}>Nombre Completo del Conductor</th>
              <th style={{ padding: '0.75rem' }}>Caducidad del Número de Licencia</th>
              <th style={{ padding: '0.75rem' }}>Estado</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Cargando lista de conductores...
                </td>
              </tr>
            ) : conductoresVisibles.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {conductores.length > 0 && !mostrarDadosDeBaja
                    ? 'No hay conductores activos para mostrar.'
                    : 'No hay conductores registrados.'}
                </td>
              </tr>
            ) : (
              conductoresVisibles.map((cond) => {
                const isActivo = cond.activo !== false;
                return (
                  <tr
                    key={cond.id_conductor}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      opacity: isActivo ? 1 : 0.6
                    }}
                  >
                    <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>#{cond.id_conductor}</td>
                    <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                      {cond.codigo_carnet || '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>{cond.nombre}</td>
                    <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                      {cond.fecha_vencimiento_licencia ? new Date(cond.fecha_vencimiento_licencia + 'T00:00:00').toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {isActivo ? (
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                          Activo
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                          Dado de Baja
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
                          onClick={() => onEditConductor(cond)}
                          title="Editar Conductor"
                        >
                          <Edit size={13} /> Editar
                        </button>
                        <button
                          className="btn-secondary"
                          style={{
                            padding: '0.3rem 0.55rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.78rem',
                            color: isActivo ? 'var(--danger)' : 'var(--success)',
                            borderColor: isActivo ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'
                          }}
                          onClick={() => onToggleBajaConductor && onToggleBajaConductor(cond)}
                          title={isActivo ? "Dar de baja del sistema" : "Reactivar en el sistema"}
                        >
                          {isActivo ? (
                            <>
                              <UserX size={13} /> Dar de Baja
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} /> Reactivar
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
