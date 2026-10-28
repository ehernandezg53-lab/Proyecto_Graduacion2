import React, { useState, useEffect } from 'react';
import { Truck, Layers, UserCheck, CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import reportesService from '@/services/reportesService';
import ReportFilterBar from './ReportFilterBar';

export const LogisticaReportsView = () => {
  const [subTab, setSubTab] = useState('viajes'); // 'viajes', 'rollos', 'licencias'
  const [loading, setLoading] = useState(false);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  // Datos
  const [reportData, setReportData] = useState({ summary: {}, data: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (subTab === 'viajes') {
        const res = await reportesService.getViajes({
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
          estado: estadoFilter || undefined,
        });
        setReportData(res);
      } else if (subTab === 'rollos') {
        const res = await reportesService.getRollos({
          estado: estadoFilter || undefined,
        });
        setReportData(res);
      } else if (subTab === 'licencias') {
        const res = await reportesService.getLicencias();
        setReportData(res);
      }
    } catch (err) {
      console.error('Error al cargar reporte de logística:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subTab]);

  const handleExportExcel = () => {
    let endpoint = '/reportes/logistica/viajes/';
    let filename = 'Viajes_Despachos';
    let params = {
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
      estado: estadoFilter || undefined,
    };

    if (subTab === 'rollos') {
      endpoint = '/reportes/logistica/rollos/';
      filename = 'Trazabilidad_Rollos';
      params = { estado: estadoFilter || undefined };
    } else if (subTab === 'licencias') {
      endpoint = '/reportes/logistica/licencias/';
      filename = 'Semaforo_Licencias_Conductores';
      params = {};
    }

    reportesService.exportFile(endpoint, params, 'excel', filename);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Subnavegación de Logística */}
      <div className="reportes-subnav">
        <button
          className={`reportes-subnav-btn ${subTab === 'viajes' ? 'active' : ''}`}
          onClick={() => setSubTab('viajes')}
        >
          Viajes y Despachos de Carga
        </button>
        <button
          className={`reportes-subnav-btn ${subTab === 'rollos' ? 'active' : ''}`}
          onClick={() => setSubTab('rollos')}
        >
          Trazabilidad y Stock de Rollos
        </button>
        <button
          className={`reportes-subnav-btn ${subTab === 'licencias' ? 'active' : ''}`}
          onClick={() => setSubTab('licencias')}
        >
          Semáforo de Licencias de Conducir
        </button>
      </div>

      {/* Encabezado formal solo para impresión */}
      <div className="print-only-header">
        <h2>SISTEMA DE GESTIÓN TM - DEPARTAMENTO DE LOGÍSTICA Y TRANSPORTE</h2>
        <p>
          {subTab === 'viajes' && 'Informe de Despachos, Envíos y Tonelaje'}
          {subTab === 'rollos' && 'Control Físico y Ubicación de Rollos de Alambre'}
          {subTab === 'licencias' && 'Control Preventivo de Licencias de Conductores'}
          {' | Fecha de emisión: '}{new Date().toLocaleString()}
        </p>
      </div>

      {/* Filtros */}
      <ReportFilterBar
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        onFilter={fetchData}
        onExportExcel={handleExportExcel}
        loading={loading}
        showDates={subTab === 'viajes'}
        extraFilters={
          subTab === 'viajes' ? (
            <div className="filter-group">
              <label className="filter-label">Estado de Viaje</label>
              <select
                className="filter-select"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="Abierta">Abierta (En Ruta)</option>
                <option value="Cerrada">Cerrada (Entregado)</option>
              </select>
            </div>
          ) : subTab === 'rollos' ? (
            <div className="filter-group">
              <label className="filter-label">Estado de Rollo</label>
              <select
                className="filter-select"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="Disponible">Disponible (En Bodega)</option>
                <option value="En Viaje">En Viaje</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>
          ) : null
        }
      />

      {/* Tarjeta de Datos y Resumen */}
      <div className="report-data-card">
        {/* Resumen Métrico */}
        {subTab === 'viajes' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Total Viajes:</span>
              <span className="summary-val">{reportData.summary.total_viajes || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">En Ruta (Abiertos):</span>
              <span className="summary-val" style={{ color: 'var(--yellow)' }}>
                {reportData.summary.viajes_abiertos || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Entregados (Cerrados):</span>
              <span className="summary-val" style={{ color: 'var(--success)' }}>
                {reportData.summary.viajes_cerrados || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Carga Total Despachada:</span>
              <span className="summary-val" style={{ color: 'var(--blue)', fontSize: '0.95rem' }}>
                {reportData.summary.total_toneladas || 0} Toneladas
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Rollos Movilizados:</span>
              <span className="summary-val">{reportData.summary.total_rollos_movilizados || 0} unds</span>
            </div>
          </div>
        )}

        {subTab === 'rollos' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Total Rollos Registrados:</span>
              <span className="summary-val">{reportData.summary.total_rollos || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Disponibles en Bodega:</span>
              <span className="summary-val" style={{ color: 'var(--success)' }}>
                {reportData.summary.disponibles || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">En Tránsito (Viaje):</span>
              <span className="summary-val" style={{ color: 'var(--yellow)' }}>
                {reportData.summary.en_viaje || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Entregados al Cliente:</span>
              <span className="summary-val" style={{ color: 'var(--blue)' }}>
                {reportData.summary.entregados || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Peso Acumulado:</span>
              <span className="summary-val">{reportData.summary.peso_total_kg?.toLocaleString()} kg</span>
            </div>
          </div>
        )}

        {subTab === 'licencias' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Total Choferes:</span>
              <span className="summary-val">{reportData.summary.total_conductores || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Licencias Vigentes:</span>
              <span className="summary-val" style={{ color: 'var(--success)' }}>
                {reportData.summary.licencias_vigentes || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Próximas a Vencer (&lt;30 días):</span>
              <span className="summary-val" style={{ color: 'var(--yellow)' }}>
                {reportData.summary.licencias_por_vencer || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Vencidas:</span>
              <span className="summary-val" style={{ color: 'var(--danger)' }}>
                {reportData.summary.licencias_vencidas || 0}
              </span>
            </div>
          </div>
        )}

        {/* Tablas de Datos */}
        <div className="report-table-wrapper">
          {subTab === 'viajes' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>N° Viaje</th>
                  <th>Fecha Envío</th>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Conductor / Piloto</th>
                  <th>Vehículo (Placa)</th>
                  <th style={{ textAlign: 'right' }}>Carga (kg)</th>
                  <th style={{ textAlign: 'right' }}>Toneladas</th>
                  <th style={{ textAlign: 'center' }}>Rollos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((v) => (
                    <tr key={v.id_viaje}>
                      <td><strong>#{v.numero_viaje}</strong></td>
                      <td>{v.fecha_envio || '-'}</td>
                      <td>{v.hora_envio}</td>
                      <td>{v.cliente}</td>
                      <td>{v.conductor}</td>
                      <td><code>{v.vehiculo}</code></td>
                      <td style={{ textAlign: 'right' }}>{v.peso_kg?.toLocaleString()} kg</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>
                        {v.toneladas} Ton
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{v.cantidad_rollos}</td>
                      <td>
                        <span className={`badge ${v.estado === 'Cerrada' ? 'badge-success' : 'badge-warning'}`}>
                          {v.estado === 'Cerrada' ? <CheckCircle size={11} style={{ display: 'inline' }} /> : <Clock size={11} style={{ display: 'inline' }} />} {v.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Cargando viajes...' : 'No se encontraron registros de viajes en el período seleccionado.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {subTab === 'rollos' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Código de Rollo</th>
                  <th>Tipo de Alambre</th>
                  <th style={{ textAlign: 'right' }}>Peso (kg)</th>
                  <th>Ubicación en Bodega</th>
                  <th>Estado Actual</th>
                  <th>Viaje Asignado</th>
                  <th>Fecha de Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((r) => (
                    <tr key={r.id_rollo}>
                      <td><code>{r.codigo_rollo}</code></td>
                      <td><strong>{r.tipo_alambre}</strong></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.peso_kg} kg</td>
                      <td>{r.ubicacion}</td>
                      <td>
                        <span className={`badge ${
                          r.estado === 'Disponible' ? 'badge-success' : r.estado === 'En Viaje' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                      <td>{r.viaje_asignado !== '-' ? <strong>#{r.viaje_asignado}</strong> : '-'}</td>
                      <td>{r.fecha_ingreso ? new Date(r.fecha_ingreso).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Consultando trazabilidad de rollos...' : 'No hay rollos registrados con el filtro actual.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {subTab === 'licencias' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Carnet / Código</th>
                  <th>Conductor / Piloto</th>
                  <th>Fecha Vencimiento</th>
                  <th style={{ textAlign: 'center' }}>Días Restantes</th>
                  <th>Estado Semáforo</th>
                  <th style={{ textAlign: 'center' }}>Activo</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((c) => (
                    <tr key={c.id_conductor}>
                      <td><code>{c.codigo_carnet}</code></td>
                      <td><strong>{c.nombre}</strong></td>
                      <td>{c.fecha_vencimiento || 'Sin registro'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {c.dias_restantes !== null ? (
                          c.dias_restantes < 0 ? (
                            <span style={{ color: 'var(--danger)' }}>Vencida hace {Math.abs(c.dias_restantes)} días</span>
                          ) : (
                            `${c.dias_restantes} días`
                          )
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`badge ${
                          c.semaforo === 'VIGENTE' ? 'badge-success' : c.semaforo === 'POR VENCER' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {c.semaforo === 'VENCIDA' && <AlertTriangle size={11} style={{ display: 'inline' }} />} {c.semaforo}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${c.activo === 'Sí' ? 'badge-success' : 'badge-danger'}`}>
                          {c.activo}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Consultando licencias...' : 'No hay conductores registrados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogisticaReportsView;
