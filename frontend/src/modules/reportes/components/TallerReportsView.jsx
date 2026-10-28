import React, { useState, useEffect } from 'react';
import { Wrench, Car, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import reportesService from '@/services/reportesService';
import ReportFilterBar from './ReportFilterBar';

export const TallerReportsView = () => {
  const [subTab, setSubTab] = useState('ordenes'); // 'ordenes', 'historial', 'productividad'
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
      if (subTab === 'ordenes') {
        const res = await reportesService.getTallerOrdenes({
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
          estado: estadoFilter || undefined,
        });
        setReportData(res);
      } else if (subTab === 'historial') {
        const res = await reportesService.getHistorialVehiculo();
        setReportData(res);
      } else if (subTab === 'productividad') {
        const res = await reportesService.getProductividadMecanicos({
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
        });
        setReportData(res);
      }
    } catch (err) {
      console.error('Error al cargar reporte de taller:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subTab]);

  const handleExportExcel = () => {
    let endpoint = '/reportes/taller/ordenes/';
    let filename = 'Ordenes_Taller';
    let params = {
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
      estado: estadoFilter || undefined,
    };

    if (subTab === 'historial') {
      endpoint = '/reportes/taller/historial-vehiculo/';
      filename = 'Historial_Mantenimiento_Vehiculos';
      params = {};
    } else if (subTab === 'productividad') {
      endpoint = '/reportes/taller/productividad-mecanicos/';
      filename = 'Productividad_Mecanicos';
      params = { fecha_desde: fechaDesde || undefined, fecha_hasta: fechaHasta || undefined };
    }

    reportesService.exportFile(endpoint, params, 'excel', filename);
  };

  const getEstadoBadge = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'finalizada':
      case 'cerrada':
        return <span className="badge badge-success"><CheckCircle size={11} style={{ display: 'inline' }} /> {estado}</span>;
      case 'en proceso':
        return <span className="badge badge-warning"><Clock size={11} style={{ display: 'inline' }} /> {estado}</span>;
      default:
        return <span className="badge badge-info"><AlertCircle size={11} style={{ display: 'inline' }} /> {estado}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Subnavegación de Taller */}
      <div className="reportes-subnav">
        <button
          className={`reportes-subnav-btn ${subTab === 'ordenes' ? 'active' : ''}`}
          onClick={() => setSubTab('ordenes')}
        >
          Órdenes de Trabajo de Mantenimiento
        </button>
        <button
          className={`reportes-subnav-btn ${subTab === 'historial' ? 'active' : ''}`}
          onClick={() => setSubTab('historial')}
        >
          Historial de Mantenimientos por Vehículo
        </button>
        <button
          className={`reportes-subnav-btn ${subTab === 'productividad' ? 'active' : ''}`}
          onClick={() => setSubTab('productividad')}
        >
          Productividad por Mecánico y Área
        </button>
      </div>

      {/* Encabezado formal solo para impresión */}
      <div className="print-only-header">
        <h2>SISTEMA DE GESTIÓN TM - DEPARTAMENTO DE TALLER</h2>
        <p>
          {subTab === 'ordenes' && 'Informe de Órdenes de Trabajo e Insumos'}
          {subTab === 'historial' && 'Hoja de Vida y Costo Acumulado por Vehículo'}
          {subTab === 'productividad' && 'Rendimiento y Asignaciones por Mecánico'}
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
        showDates={subTab !== 'historial'}
        extraFilters={
          subTab === 'ordenes' ? (
            <div className="filter-group">
              <label className="filter-label">Estado de Orden</label>
              <select
                className="filter-select"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="Abierta">Abierta</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Finalizada">Finalizada</option>
              </select>
            </div>
          ) : null
        }
      />

      {/* Tarjeta de Datos y Resumen */}
      <div className="report-data-card">
        {/* Resumen Métrico */}
        {subTab === 'ordenes' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Total Órdenes:</span>
              <span className="summary-val">{reportData.summary.total_ordenes || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Abiertas:</span>
              <span className="summary-val" style={{ color: 'var(--yellow)' }}>
                {reportData.summary.abiertas || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">En Proceso:</span>
              <span className="summary-val" style={{ color: 'var(--blue)' }}>
                {reportData.summary.en_proceso || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Finalizadas:</span>
              <span className="summary-val" style={{ color: 'var(--success)' }}>
                {reportData.summary.finalizadas || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Inversión Total en Repuestos:</span>
              <span className="summary-val" style={{ color: 'var(--blue)' }}>
                Q{reportData.summary.costo_total_repuestos_usd?.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
          </div>
        )}

        {subTab === 'historial' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Vehículos Analizados:</span>
              <span className="summary-val">{reportData.summary.total_vehiculos_analizados || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Inversión Total Acumulada en Flota:</span>
              <span className="summary-val" style={{ color: 'var(--blue)', fontSize: '0.95rem' }}>
                Q{reportData.summary.total_inversion_flota_usd?.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
          </div>
        )}

        {subTab === 'productividad' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Técnicos Evaluados:</span>
              <span className="summary-val">{reportData.summary.total_mecanicos || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Órdenes Asignadas:</span>
              <span className="summary-val">{reportData.summary.total_ordenes_asignadas || 0}</span>
            </div>
          </div>
        )}

        {/* Tablas de Datos */}
        <div className="report-table-wrapper">
          {subTab === 'ordenes' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>N° Orden</th>
                  <th>Fecha</th>
                  <th>Vehículo (Placa)</th>
                  <th>Unidad</th>
                  <th>Mecánico Asignado</th>
                  <th>Área / Especialidad</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Repuestos Usados</th>
                  <th style={{ textAlign: 'right' }}>Costo Repuestos (Q)</th>
                  <th>Descripción del Trabajo</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((ot) => (
                    <tr key={ot.id_orden}>
                      <td><strong>#{ot.numero_orden}</strong></td>
                      <td>{ot.fecha ? new Date(ot.fecha).toLocaleString() : '-'}</td>
                      <td><code>{ot.vehiculo_placa}</code></td>
                      <td>{ot.vehiculo_unidad}</td>
                      <td>{ot.mecanico}</td>
                      <td>{ot.area}</td>
                      <td>{getEstadoBadge(ot.estado)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{ot.repuestos_cantidad}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>
                        Q{ot.costo_repuestos_usd?.toFixed(2)}
                      </td>
                      <td>{ot.descripcion || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Cargando órdenes de trabajo...' : 'No se encontraron órdenes de trabajo con los filtros aplicados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {subTab === 'historial' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Unidad</th>
                  <th>Modelo</th>
                  <th>Estado Operativo</th>
                  <th style={{ textAlign: 'center' }}>Órdenes Totales</th>
                  <th style={{ textAlign: 'center' }}>Repuestos Invertidos</th>
                  <th style={{ textAlign: 'right' }}>Inversión Acumulada (Q)</th>
                  <th>Última Intervención</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((v) => (
                    <tr key={v.id_vehiculo}>
                      <td><strong>{v.placa}</strong></td>
                      <td>{v.unidad}</td>
                      <td>{v.modelo}</td>
                      <td>
                        <span className={`badge ${v.estado_actual === 'Disponible' ? 'badge-success' : 'badge-warning'}`}>
                          {v.estado_actual}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{v.total_ordenes}</td>
                      <td style={{ textAlign: 'center' }}>{v.total_repuestos_usados}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>
                        Q{v.costo_total_mantenimientos_usd?.toFixed(2)}
                      </td>
                      <td>{v.ultimo_mantenimiento ? new Date(v.ultimo_mantenimiento).toLocaleString() : 'Sin registros'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Consultando historial de la flota...' : 'No hay vehículos registrados en el taller.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {subTab === 'productividad' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Mecánico</th>
                  <th>Área / Especialidad</th>
                  <th>Activo</th>
                  <th style={{ textAlign: 'center' }}>Abiertas</th>
                  <th style={{ textAlign: 'center' }}>En Proceso</th>
                  <th style={{ textAlign: 'center' }}>Finalizadas</th>
                  <th style={{ textAlign: 'center' }}>Total Atendidas</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((m) => (
                    <tr key={m.id_mecanico}>
                      <td><strong>{m.nombre}</strong></td>
                      <td>{m.area}</td>
                      <td>
                        <span className={`badge ${m.activo === 'Sí' ? 'badge-success' : 'badge-danger'}`}>
                          {m.activo}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--yellow)', fontWeight: 600 }}>{m.ordenes_abiertas}</td>
                      <td style={{ textAlign: 'center', color: 'var(--blue)', fontWeight: 600 }}>{m.ordenes_en_proceso}</td>
                      <td style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 700 }}>{m.ordenes_finalizadas}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{m.total_ordenes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Calculando productividad...' : 'No hay mecánicos registrados.'}
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

export default TallerReportsView;
