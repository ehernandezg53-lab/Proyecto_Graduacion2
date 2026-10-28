import React from 'react';
import { Package, Wrench, Navigation, BarChart3, Clock, CheckCircle } from 'lucide-react';

export const ModulePlaceholder = ({ moduleId, roleName }) => {
  const getModuleInfo = () => {
    switch (moduleId) {
      case 'bodega':
        return {
          title: 'Módulo: Bodega de Repuestos',
          icon: Package,
          color: '#f59e0b',
          roleReq: 'Bodeguero / Administrador',
          deliverable: 'Entregable 2',
          features: [
            'Gestión de inventario de repuestos (marca, código, stock, precio unitario)',
            'Órdenes de ingreso creadas por el Administrador',
            'Verificación y registro de entradas por el Bodeguero',
            'Salidas de bodega vinculadas a órdenes de trabajo de taller'
          ]
        };
      case 'taller':
        return {
          title: 'Módulo: Taller & Órdenes de Trabajo',
          icon: Wrench,
          color: '#10b981',
          roleReq: 'Taller / Administrador',
          deliverable: 'Entregable 3',
          features: [
            'Creación de órdenes de trabajo (unidad asignada, fecha, mecánico, área y motivo)',
            'Flujo de estados: Pendiente → En Proceso → Finalizada → Cerrada',
            'Asignación de repuestos consumidos desde bodega',
            'Historial de mantenimiento por unidad vehicular'
          ]
        };
      case 'logistica':
        return {
          title: 'Módulo: Viajes de Logística',
          icon: Navigation,
          color: '#06b6d4',
          roleReq: 'Logística / Administrador',
          deliverable: 'Entregable 4',
          features: [
            'Asignación de viajes (unidad + conductor externo + cliente)',
            'Asociación automática de ruta fija por cliente',
            'Validación de vigencia del carnet del conductor',
            'Control de fechas de salida y entrega'
          ]
        };
      case 'reportes':
        return {
          title: 'Módulo: Reportes & Dashboard',
          icon: BarChart3,
          color: '#8b5cf6',
          roleReq: 'Administrador',
          deliverable: 'Entregable 5',
          features: [
            'Dashboard interactivo de KPIs en tiempo real',
            'Exportación de reportes tabulares a Excel',
            'Generación de reportes formateados en PDF',
            'Almacenamiento de reportes generados en Supabase Storage'
          ]
        };
      default:
        return { title: 'Módulo', icon: Package, color: '#3b82f6', deliverable: 'Próximo Entregable', features: [] };
    }
  };

  const info = getModuleInfo();
  const Icon = info.icon;

  return (
    <div class="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '700px', margin: '2rem auto' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '20px',
        background: `rgba(${info.color === '#f59e0b' ? '245, 158, 11' : info.color === '#10b981' ? '16, 185, 129' : info.color === '#06b6d4' ? '6, 182, 212' : '139, 92, 246'}, 0.15)`,
        color: info.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem', boxShadow: `0 8px 24px ${info.color}33`
      }}>
        <Icon size={34} />
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
        {info.title}
      </h2>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <Clock size={16} style={{ color: info.color }} />
        <span>Programado para: <strong>{info.deliverable}</strong></span>
      </div>

      <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--bg-card-border)' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Alcance y Funcionalidades del Módulo:
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {info.features.map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <CheckCircle size={18} style={{ color: info.color, flexShrink: 0, marginTop: '0.1rem' }} />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
