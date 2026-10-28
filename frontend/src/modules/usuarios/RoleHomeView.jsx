import React from 'react';
import { Package, Wrench, Navigation, ShieldCheck, Lock } from 'lucide-react';

export const RoleHomeView = ({ user }) => {
  const getRoleConfig = () => {
    switch (user?.rol) {
      case 'Bodeguero':
        return {
          title: 'Módulo de Bodega de Repuestos',
          icon: Package,
          desc: 'Gestión de inventario de repuestos, recepción de órdenes de ingreso y registro de salidas.'
        };
      case 'Taller':
        return {
          title: 'Módulo de Taller & Órdenes de Trabajo',
          icon: Wrench,
          desc: 'Creación de órdenes de trabajo, seguimiento por área y asignación de repuestos.'
        };
      case 'Logística':
        return {
          title: 'Módulo de Viajes & Logística',
          icon: Navigation,
          desc: 'Asignación de unidades, conductores con carnet vigente y gestión de rutas por cliente.'
        };
      default:
        return {
          title: 'Módulo Asignado',
          icon: ShieldCheck,
          desc: 'Cuenta de usuario activa en el sistema.'
        };
    }
  };

  const config = getRoleConfig();
  const Icon = config.icon;

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: 'var(--radius)',
          backgroundColor: 'var(--blue)', color: 'var(--yellow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)' }}>
            {config.title}
          </h2>
          <div style={{ color: 'var(--yellow)', fontSize: '0.8rem', fontWeight: 600 }}>
            Rol Activo: {user?.rol}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
        Hola <strong>{user?.nombre} {user?.apellido}</strong>. Has iniciado sesión correctamente. {config.desc}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-element)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <Lock size={14} style={{ color: 'var(--yellow)' }} />
        <span>Nota: El módulo de Gestión de Usuarios está reservado exclusivamente para el Administrador.</span>
      </div>
    </div>
  );
};
