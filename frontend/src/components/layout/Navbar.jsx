import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Truck, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case 'Administrador': return 'badge-admin';
      case 'Bodeguero': return 'badge-bodega';
      case 'Taller': return 'badge-taller';
      case 'Logística': return 'badge-logistica';
      default: return 'badge-admin';
    }
  };

  const getInitials = (nombre, apellido) => {
    const n = nombre ? nombre[0] : '';
    const a = apellido ? apellido[0] : '';
    return (n + a).toUpperCase() || 'U';
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon-box" style={{ width: '36px', height: '36px', marginBottom: 0 }}>
          <Truck size={20} />
        </div>
        <span>Sistema de Gestión <strong style={{ color: 'var(--yellow)' }}>TM</strong></span>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-profile-badge">
            <div className="avatar">
              {getInitials(user.nombre, user.apellido)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)' }}>
                {user.nombre} {user.apellido}
              </span>
              <span className={`badge-role ${getRoleBadgeClass(user.rol)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', marginTop: '0.15rem' }}>
                {user.rol || 'Sin Rol'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-secondary"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.8rem', fontSize: '0.825rem', color: 'var(--danger)',
              borderColor: 'rgba(220, 38, 38, 0.3)'
            }}
            title="Cerrar sesión"
          >
            <LogOut size={15} />
            <span>Salir</span>
          </button>
        </div>
      )}
    </header>
  );
};
