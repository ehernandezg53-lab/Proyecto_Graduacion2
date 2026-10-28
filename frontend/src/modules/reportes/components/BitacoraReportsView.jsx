import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, UserCheck } from 'lucide-react';
import reportesService from '@/services/reportesService';
import ReportFilterBar from './ReportFilterBar';

export const BitacoraReportsView = () => {
  const [loading, setLoading] = useState(false);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [moduloFilter, setModuloFilter] = useState('');
  const [accionFilter, setAccionFilter] = useState('');
  const [usuarioFilter, setUsuarioFilter] = useState('');

  // Datos
  const [reportData, setReportData] = useState({ summary: {}, data: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportesService.getAuditoria({
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        modulo: moduloFilter || undefined,
        accion: accionFilter || undefined,
        usuario: usuarioFilter || undefined,
      });
      setReportData(res);
    } catch (err) {
      console.error('Error al cargar reporte de auditoría:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportExcel = () => {
    reportesService.exportFile(
      '/reportes/bitacora/auditoria/',
      {
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        modulo: moduloFilter || undefined,
        accion: accionFilter || undefined,
        usuario: usuarioFilter || undefined,
      },
      'excel',
      'Auditoria_ISO27001'
    );
  };

  const getAccionBadge = (accion) => {
    if (accion.includes('Fallido') || accion === 'LOGIN_FALLIDO') {
      return <span className="badge badge-danger"><AlertTriangle size={11} style={{ display: 'inline' }} /> {accion}</span>;
    }
    if (accion.includes('Eliminación') || accion === 'ELIMINAR') {
      return <span className="badge badge-danger">{accion}</span>;
    }
    if (accion.includes('Modificación') || accion === 'MODIFICAR') {
      return <span className="badge badge-warning">{accion}</span>;
    }
    if (accion.includes('Creación') || accion === 'CREAR') {
      return <span className="badge badge-success">{accion}</span>;
    }
    return <span className="badge badge-info">{accion}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Encabezado formal solo para impresión */}
      <div className="print-only-header">
        <h2>SISTEMA DE GESTIÓN TM - AUDITORÍA Y TRAZABILIDAD ISO/IEC 27001</h2>
        <p>Informe de Eventos Inmutables, Control de Accesos y Seguridad | Fecha de emisión: {new Date().toLocaleString()}</p>
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
        showDates={true}
        extraFilters={
          <>
            <div className="filter-group">
              <label className="filter-label">Módulo</label>
              <select
                className="filter-select"
                value={moduloFilter}
                onChange={(e) => setModuloFilter(e.target.value)}
              >
                <option value="">Todos los Módulos</option>
                <option value="Bodega">Bodega</option>
                <option value="Taller">Taller</option>
                <option value="Logística">Logística</option>
                <option value="Seguridad y Usuarios">Seguridad y Usuarios</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Tipo de Acción</label>
              <select
                className="filter-select"
                value={accionFilter}
                onChange={(e) => setAccionFilter(e.target.value)}
              >
                <option value="">Todas las Acciones</option>
                <option value="LOGIN_EXITOSO">Inicio Exitoso</option>
                <option value="LOGIN_FALLIDO">Login Fallido</option>
                <option value="CREAR">Creación</option>
                <option value="MODIFICAR">Modificación</option>
                <option value="ELIMINAR">Eliminación</option>
                <option value="RESTABLECIMIENTO">Restablecimiento</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Usuario</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Filtrar por username..."
                value={usuarioFilter}
                onChange={(e) => setUsuarioFilter(e.target.value)}
                style={{ width: '160px' }}
              />
            </div>
          </>
        }
      />

      {/* Tarjeta de Datos y Resumen */}
      <div className="report-data-card">
        {reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Total Eventos Históricos:</span>
              <span className="summary-val">{reportData.summary.total_eventos || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Registros Mostrados:</span>
              <span className="summary-val">{reportData.summary.registros_mostrados || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Intentos Fallidos de Acceso:</span>
              <span className="summary-val" style={{ color: 'var(--danger)' }}>
                {reportData.summary.logins_fallidos || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Modificaciones / Bajas:</span>
              <span className="summary-val" style={{ color: 'var(--yellow)' }}>
                {reportData.summary.modificaciones_criticas || 0}
              </span>
            </div>
          </div>
        )}

        {/* Tabla de Eventos */}
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha y Hora</th>
                <th>Usuario Responsable</th>
                <th>Acción Realizada</th>
                <th>Módulo Afectado</th>
                <th style={{ textAlign: 'center' }}>Método</th>
                <th>Endpoint / Ruta</th>
                <th>IP Origen</th>
                <th style={{ textAlign: 'center' }}>HTTP Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.data?.length > 0 ? (
                reportData.data.map((r) => (
                  <tr key={r.id_bitacora}>
                    <td>#{r.id_bitacora}</td>
                    <td>{r.fecha_hora ? new Date(r.fecha_hora).toLocaleString() : '-'}</td>
                    <td><strong>{r.usuario}</strong></td>
                    <td>{getAccionBadge(r.accion)}</td>
                    <td>{r.modulo}</td>
                    <td style={{ textAlign: 'center' }}>
                      <code>{r.metodo}</code>
                    </td>
                    <td><code>{r.ruta}</code></td>
                    <td>{r.ip_origen}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${r.codigo_respuesta < 400 ? 'badge-success' : 'badge-danger'}`}>
                        {r.codigo_respuesta}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Cargando registros de auditoría...' : 'No se registraron eventos con los filtros seleccionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BitacoraReportsView;
