import React from 'react';
import {
  Package,
  Wrench,
  Truck,
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-react';

export const DashboardKpis = ({ kpis, onNavigate }) => {
  if (!kpis) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. SECCIÓN BODEGA */}
      {kpis.bodega && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Package size={17} /> Indicadores de Bodega de Repuestos
            </h3>
            <button
              className="btn-action"
              onClick={() => onNavigate('bodega', 'kardex')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              Ver Reportes <ArrowRight size={13} />
            </button>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card success">
              <div className="kpi-header">
                <span className="kpi-title">Valorización de Inventario</span>
                <div className="kpi-icon-wrapper" style={{ background: '#d1fae5', color: '#059669' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="kpi-value">Q{kpis.bodega.valor_inventario_usd?.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="kpi-subtext">Valor total en almacén ({kpis.bodega.total_items} repuestos)</div>
            </div>

            <div className={`kpi-card ${kpis.bodega.alertas_stock_critico > 0 ? 'warning' : 'success'}`}>
              <div className="kpi-header">
                <span className="kpi-title">Alerta de Stock Bajo</span>
                <div className="kpi-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value">{kpis.bodega.alertas_stock_critico}</div>
              <div className="kpi-subtext">
                {kpis.bodega.alertas_stock_critico > 0 ? (
                  <strong style={{ color: 'var(--yellow)' }}>{kpis.bodega.alertas_stock_critico} repuestos con stock ≤ 2 unidades</strong>
                ) : (
                  'Todos los repuestos con stock adecuado'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECCIÓN TALLER */}
      {kpis.taller && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Wrench size={17} /> Rendimiento de Taller Mecánico
            </h3>
            <button
              className="btn-action"
              onClick={() => onNavigate('taller', 'ordenes')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              Ver Reportes <ArrowRight size={13} />
            </button>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Órdenes Activas</span>
                <div className="kpi-icon-wrapper">
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value">
                {kpis.taller.ordenes_abiertas + kpis.taller.ordenes_en_proceso}
              </div>
              <div className="kpi-subtext">
                {kpis.taller.ordenes_abiertas} abiertas, {kpis.taller.ordenes_en_proceso} en proceso
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Costo Invertido en Repuestos</span>
                <div className="kpi-icon-wrapper">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="kpi-value">Q{kpis.taller.costo_repuestos_usd?.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="kpi-subtext">Inversión registrada en mantenimiento</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECCIÓN LOGÍSTICA */}
      {kpis.logistica && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={17} /> Operaciones de Logística y Despacho
            </h3>
            <button
              className="btn-action"
              onClick={() => onNavigate('logistica', 'viajes')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              Ver Reportes <ArrowRight size={13} />
            </button>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Total Carga Despachada</span>
                <div className="kpi-icon-wrapper">
                  <Truck size={18} />
                </div>
              </div>
              <div className="kpi-value">{kpis.logistica.total_toneladas} Ton</div>
              <div className="kpi-subtext">{kpis.logistica.total_viajes} viajes registrados ({kpis.logistica.viajes_abiertos} en ruta)</div>
            </div>

            <div className={`kpi-card ${kpis.logistica.licencias_por_vencer > 0 ? 'warning' : 'success'}`}>
              <div className="kpi-header">
                <span className="kpi-title">Licencias por Vencer / Vencidas</span>
                <div className="kpi-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value">{kpis.logistica.licencias_por_vencer}</div>
              <div className="kpi-subtext">Alertas preventivas de conductores</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECCIÓN AUDITORÍA */}
      {kpis.bitacora && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={17} /> Auditoría y Seguridad ISO 27001
            </h3>
            <button
              className="btn-action"
              onClick={() => onNavigate('bitacora', 'auditoria')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              Ver Reportes <ArrowRight size={13} />
            </button>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Eventos Registrados</span>
                <div className="kpi-icon-wrapper">
                  <ShieldAlert size={18} />
                </div>
              </div>
              <div className="kpi-value">{kpis.bitacora.total_eventos}</div>
              <div className="kpi-subtext">{kpis.bitacora.modificaciones_criticas} modificaciones o eliminaciones</div>
            </div>

            <div className={`kpi-card ${kpis.bitacora.logins_fallidos > 0 ? 'danger' : 'success'}`}>
              <div className="kpi-header">
                <span className="kpi-title">Logins Fallidos</span>
                <div className="kpi-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value">{kpis.bitacora.logins_fallidos}</div>
              <div className="kpi-subtext">Intentos de acceso no autorizados</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardKpis;
