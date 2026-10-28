import React, { useState, useEffect } from 'react';
import { Package, ArrowDownRight, ArrowUpRight, AlertTriangle, DollarSign } from 'lucide-react';
import reportesService from '@/services/reportesService';
import ReportFilterBar from './ReportFilterBar';

export const BodegaReportsView = () => {
  const [subTab, setSubTab] = useState('kardex'); // 'kardex', 'stock-critico', 'valorizacion'
  const [loading, setLoading] = useState(false);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Datos
  const [reportData, setReportData] = useState({ summary: {}, data: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (subTab === 'kardex') {
        const res = await reportesService.getKardex({
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
        });
        setReportData(res);
      } else if (subTab === 'stock-critico') {
        const res = await reportesService.getStockCritico();
        setReportData(res);
      } else if (subTab === 'valorizacion') {
        const res = await reportesService.getValorizacion();
        setReportData(res);
      }
    } catch (err) {
      console.error('Error al cargar reporte de bodega:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subTab]);

  const handleExportExcel = () => {
    let endpoint = '/reportes/bodega/kardex/';
    let filename = 'Kardex_Bodega';
    let params = { fecha_desde: fechaDesde || undefined, fecha_hasta: fechaHasta || undefined };

    if (subTab === 'stock-critico') {
      endpoint = '/reportes/bodega/stock-critico/';
      filename = 'Stock_Critico_Bodega';
      params = {};
    } else if (subTab === 'valorizacion') {
      endpoint = '/reportes/bodega/valorizacion/';
      filename = 'Valorizacion_Inventario';
      params = {};
    }

    reportesService.exportFile(endpoint, params, 'excel', filename);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Subnavegación de Bodega */}
      <div className="reportes-subnav">
        <button
          className={`reportes-subnav-btn ${subTab === 'kardex' ? 'active' : ''}`}
          onClick={() => setSubTab('kardex')}
        >
          Kardex de Movimientos (Entradas / Salidas)
        </button>
        <button
          className={`reportes-subnav-btn ${subTab === 'stock-critico' ? 'active' : ''}`}
          onClick={() => setSubTab('stock-critico')}
        >
          Alertas de Stock Bajo (≤ 2 unds)
        </button>
        <button
          className={`reportes-subnav-btn ${subTab === 'valorizacion' ? 'active' : ''}`}
          onClick={() => setSubTab('valorizacion')}
        >
          Valorización Total del Inventario
        </button>
      </div>

      {/* Encabezado formal solo para impresión */}
      <div className="print-only-header">
        <h2>SISTEMA DE GESTIÓN TM - DEPARTAMENTO DE BODEGA</h2>
        <p>
          {subTab === 'kardex' && 'Kardex Histórico de Movimientos de Repuestos'}
          {subTab === 'stock-critico' && 'Informe de Repuestos con Alerta de Stock Bajo (≤ 2 unds)'}
          {subTab === 'valorizacion' && 'Valorización de Existencias en Bodega'}
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
        showDates={subTab === 'kardex'}
      />

      {/* Tarjeta de Datos y Resumen */}
      <div className="report-data-card">
        {/* Resumen Métrico */}
        {subTab === 'kardex' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Total Movimientos:</span>
              <span className="summary-val">{reportData.summary.total_movimientos || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Unidades Ingresadas:</span>
              <span className="summary-val" style={{ color: 'var(--success)' }}>
                +{reportData.summary.total_unidades_ingresadas || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Unidades Egresadas:</span>
              <span className="summary-val" style={{ color: 'var(--danger)' }}>
                -{reportData.summary.total_unidades_egresadas || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Monto Egresos (Repuestos Usados):</span>
              <span className="summary-val">
                Q{reportData.summary.monto_salidas_usd?.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
          </div>
        )}

        {subTab === 'stock-critico' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Total Repuestos con Stock Bajo (≤ 2 unds):</span>
              <span className="summary-val" style={{ color: 'var(--yellow)' }}>{reportData.summary.total_alertas || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Costo Estimado de Reposición:</span>
              <span className="summary-val" style={{ color: 'var(--yellow)' }}>
                Q{reportData.summary.costo_total_reposicion_usd?.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
          </div>
        )}

        {subTab === 'valorizacion' && reportData.summary && (
          <div className="report-summary-bar">
            <div className="summary-item">
              <span className="summary-label">Ítems Registrados:</span>
              <span className="summary-val">{reportData.summary.total_items_registrados || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Unidades Físicas:</span>
              <span className="summary-val">{reportData.summary.total_unidades_almacen || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Valorización Total:</span>
              <span className="summary-val" style={{ color: 'var(--success)', fontSize: '1rem' }}>
                Q{reportData.summary.valor_total_inventario_usd?.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
          </div>
        )}

        {/* Tablas de Datos */}
        <div className="report-table-wrapper">
          {subTab === 'kardex' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Documento</th>
                  <th>Código</th>
                  <th>Repuesto</th>
                  <th style={{ textAlign: 'right' }}>Entrada</th>
                  <th style={{ textAlign: 'right' }}>Salida</th>
                  <th style={{ textAlign: 'right' }}>Precio Unit. (Q)</th>
                  <th style={{ textAlign: 'right' }}>Total Mov. (Q)</th>
                  <th>Responsable</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((m, idx) => (
                    <tr key={idx}>
                      <td>{m.fecha ? new Date(m.fecha).toLocaleString() : '-'}</td>
                      <td>
                        <span className={`badge ${m.tipo === 'INGRESO' ? 'badge-success' : 'badge-danger'}`}>
                          {m.tipo === 'INGRESO' ? <ArrowDownRight size={12} style={{ display: 'inline' }} /> : <ArrowUpRight size={12} style={{ display: 'inline' }} />} {m.tipo}
                        </span>
                      </td>
                      <td><strong>{m.documento}</strong></td>
                      <td><code>{m.repuesto_codigo}</code></td>
                      <td>{m.repuesto_nombre}</td>
                      <td style={{ textAlign: 'right', fontWeight: m.cantidad_entrada > 0 ? 700 : 400 }}>
                        {m.cantidad_entrada > 0 ? `+${m.cantidad_entrada}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: m.cantidad_salida > 0 ? 700 : 400 }}>
                        {m.cantidad_salida > 0 ? `-${m.cantidad_salida}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>Q{m.precio_unitario?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>Q{m.total_movimiento?.toFixed(2)}</td>
                      <td>{m.responsable}</td>
                      <td>{m.observaciones}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Cargando movimientos de kardex...' : 'No se registraron movimientos en el rango de fechas seleccionado.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {subTab === 'stock-critico' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Repuesto</th>
                  <th style={{ textAlign: 'center' }}>Stock Actual</th>
                  <th style={{ textAlign: 'center' }}>Déficit a Reponer</th>
                  <th>Nivel de Alerta</th>
                  <th style={{ textAlign: 'right' }}>Precio Unit. (Q)</th>
                  <th style={{ textAlign: 'right' }}>Costo Reposición Est. (Q)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((r) => (
                    <tr key={r.id_repuesto}>
                      <td><code>{r.codigo}</code></td>
                      <td><strong>{r.nombre}</strong></td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--yellow)' }}>
                        {r.stock_actual}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--yellow)', fontWeight: 700 }}>
                        {r.deficit > 0 ? `+${r.deficit} unds` : 'OK'}
                      </td>
                      <td>
                        <span className="badge badge-warning">
                          Stock Bajo
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>Q{r.precio_unitario?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>Q{r.costo_estimado_reponer?.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--success)' }}>
                      {loading ? 'Consultando stock de repuestos...' : '¡Excelente! Todos los repuestos tienen stock superior al mínimo.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {subTab === 'valorizacion' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Repuesto</th>
                  <th style={{ textAlign: 'center' }}>Stock Disponible</th>
                  <th style={{ textAlign: 'right' }}>Precio Unitario (Q)</th>
                  <th style={{ textAlign: 'right' }}>Valor Total en Inventario (Q)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data?.length > 0 ? (
                  reportData.data.map((r) => (
                    <tr key={r.id_repuesto}>
                      <td><code>{r.codigo}</code></td>
                      <td><strong>{r.nombre}</strong></td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.stock}</td>
                      <td style={{ textAlign: 'right' }}>Q{r.precio_unitario?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>
                        Q{r.valor_total?.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Calculando valorización...' : 'No hay repuestos registrados en el catálogo.'}
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

export default BodegaReportsView;
