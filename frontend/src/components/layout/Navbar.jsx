import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';

export const Navbar = ({ isSidebarOpen, toggleSidebar }) => {
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
      <div className="navbar-left">
        <button
          type="button"
          className="sidebar-mobile-toggle"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          title={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="navbar-brand">
          <div className="brand-icon-box">
            <span className="brand-letters">TM</span>
          </div>
          <span className="brand-title-desktop">
            Sistema de Gestión <strong style={{ color: 'var(--yellow)' }}>TM</strong>
          </span>
          <span className="brand-title-mobile">
            Gestión <strong style={{ color: 'var(--yellow)' }}>TM</strong>
          </span>
        </div>
      </div>

      {user && (
        <div className="navbar-right">
          <div className="user-profile-badge">
            <div className="avatar">
              {getInitials(user.nombre, user.apellido)}
            </div>
            <div className="user-info-text">
              <span className="user-full-name">
                {user.nombre} {user.apellido}
              </span>
              <span className={`badge-role ${getRoleBadgeClass(user.rol)}`}>
                {user.rol || 'Sin Rol'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-secondary btn-logout"
            title="Cerrar sesión"
          >
            <LogOut size={15} />
            <span className="logout-text">Salir</span>
          </button>
        </div>
      )}
    </header>
  );
};
