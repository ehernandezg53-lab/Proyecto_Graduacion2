import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
  Users,
  Package,
  Wrench,
  Navigation,
  ChevronDown,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Truck,
  Building2,
  UserCheck,
  Car,
  Layers,
  KeyRound,
  BarChart3
} from 'lucide-react';

export const Sidebar = ({ activeTab, activeSubTab, onSelectModule, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.rol;

  // Estado para controlar qué módulos están expandidos en el acordeón
  const [expandedModules, setExpandedModules] = useState({
    bodega: false,
    taller: false,
    logistica: false,
    users: false,
    reportes: false
  });

  // Conteo de solicitudes pendientes para badge
  const [pendientesCount, setPendientesCount] = useState(0);

  // Asegurar que el módulo actualmente activo esté expandido
  useEffect(() => {
    if (activeTab) {
      setExpandedModules(prev => ({
        ...prev,
        [activeTab]: true
      }));
    }
  }, [activeTab]);

  // Consultar conteo de solicitudes pendientes si es admin o tiene permiso
  useEffect(() => {
    const fetchPendingTickets = async () => {
      try {
        if (role === 'Administrador' || user?.permisos?.some(p => p.nombre_permiso === 'ver_usuarios')) {
          const res = await api.get('/solicitudes_restablecimiento/', { params: { estado: 'Pendiente' } });
          setPendientesCount(Array.isArray(res.data) ? res.data.length : 0);
        }
      } catch (e) {
        // Silenciar error en background
      }
    };
    fetchPendingTickets();
  }, [role, user]);

  // Verifica permisos según el rol del usuario
  const hasUserPermission = user?.permisos?.some(p => p.nombre_permiso === 'ver_usuarios');
  const hasBodegaPermission = role === 'Administrador' || role === 'Bodeguero' || user?.permisos?.some(p => p.nombre_permiso === 'ver_bodega');
  const hasTallerPermission = role === 'Administrador' || role === 'Taller' || user?.permisos?.some(p => p.nombre_permiso === 'ver_taller');
  const hasLogisticaPermission = role === 'Administrador' || role === 'Logística' || user?.permisos?.some(p => p.nombre_permiso === 'ver_logistica');
  const hasReportesPermission = role === 'Administrador' || hasBodegaPermission || hasTallerPermission || hasLogisticaPermission || hasUserPermission;

  const handleModuleClick = (moduleKey, defaultSubTab) => {
    // Si ya está activo, permite alternar la expansión (abrir/cerrar)
    if (activeTab === moduleKey) {
      setExpandedModules(prev => ({
        ...prev,
        [moduleKey]: !prev[moduleKey]
      }));
    } else {
      // Si entra a un nuevo módulo, lo expande y abre su primera pantalla
      setExpandedModules(prev => ({
        ...prev,
        [moduleKey]: true
      }));
      if (onSelectModule) {
        onSelectModule(moduleKey, defaultSubTab);
      } else if (setActiveTab) {
        setActiveTab(moduleKey);
      }
    }
  };

  const handleSubTabClick = (moduleKey, subTabKey, e) => {
    e.stopPropagation();
    if (onSelectModule) {
      onSelectModule(moduleKey, subTabKey);
    } else if (setActiveTab) {
      setActiveTab(moduleKey);
    }
  };

  const toggleChevron = (moduleKey, e) => {
    e.stopPropagation();
    setExpandedModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  return (
    <aside className="sidebar">
      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--yellow)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
        Navegación Principal
      </div>

      {/* 1. MÓDULO DE BODEGA */}
      {hasBodegaPermission && (
        <div style={{ marginBottom: '0.25rem' }}>
          <div
            className={`nav-item ${activeTab === 'bodega' ? 'active' : ''}`}
            onClick={() => handleModuleClick('bodega', 'inventario')}
          >
            <div className="nav-item-content">
              <Package size={18} />
              <span>Bodega de Repuestos</span>
            </div>
            <div onClick={(e) => toggleChevron('bodega', e)} style={{ display: 'flex', alignItems: 'center' }}>
              {expandedModules.bodega ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>

          {expandedModules.bodega && (
            <div className="nav-sub-container">
              <div
                className={`nav-subitem ${activeTab === 'bodega' && activeSubTab === 'inventario' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('bodega', 'inventario', e)}
              >
                <div className="nav-subitem-content">
                  <Package size={14} />
                  <span>Inventario</span>
                </div>
              </div>

              <div
                className={`nav-subitem ${activeTab === 'bodega' && activeSubTab === 'ingresos' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('bodega', 'ingresos', e)}
              >
                <div className="nav-subitem-content">
                  <ArrowDownRight size={14} style={{ color: 'var(--success)' }} />
                  <span>Ingresos a Bodega</span>
                </div>
              </div>

              <div
                className={`nav-subitem ${activeTab === 'bodega' && activeSubTab === 'salidas' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('bodega', 'salidas', e)}
              >
                <div className="nav-subitem-content">
                  <ArrowUpRight size={14} style={{ color: 'var(--danger)' }} />
                  <span>Salidas de Repuestos</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MÓDULO DE TALLER */}
      {hasTallerPermission && (
        <div style={{ marginBottom: '0.25rem' }}>
          <div
            className={`nav-item ${activeTab === 'taller' ? 'active' : ''}`}
            onClick={() => handleModuleClick('taller', 'ordenes')}
          >
            <div className="nav-item-content">
              <Wrench size={18} />
              <span>Módulo de Taller</span>
            </div>
            <div onClick={(e) => toggleChevron('taller', e)} style={{ display: 'flex', alignItems: 'center' }}>
              {expandedModules.taller ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>

          {expandedModules.taller && (
            <div className="nav-sub-container">
              <div
                className={`nav-subitem ${activeTab === 'taller' && activeSubTab === 'ordenes' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('taller', 'ordenes', e)}
              >
                <div className="nav-subitem-content">
                  <FileText size={14} />
                  <span>Órdenes de Trabajo</span>
                </div>
              </div>

              <div
                className={`nav-subitem ${activeTab === 'taller' && activeSubTab === 'mecanicos' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('taller', 'mecanicos', e)}
              >
                <div className="nav-subitem-content">
                  <Users size={14} />
                  <span>Mecánicos y Áreas</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MÓDULO DE LOGÍSTICA */}
      {hasLogisticaPermission && (
        <div style={{ marginBottom: '0.25rem' }}>
          <div
            className={`nav-item ${activeTab === 'logistica' ? 'active' : ''}`}
            onClick={() => handleModuleClick('logistica', 'viajes')}
          >
            <div className="nav-item-content">
              <Navigation size={18} />
              <span>Módulo de Logística</span>
            </div>
            <div onClick={(e) => toggleChevron('logistica', e)} style={{ display: 'flex', alignItems: 'center' }}>
              {expandedModules.logistica ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>

          {expandedModules.logistica && (
            <div className="nav-sub-container">
              <div
                className={`nav-subitem ${activeTab === 'logistica' && activeSubTab === 'viajes' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('logistica', 'viajes', e)}
              >
                <div className="nav-subitem-content">
                  <Truck size={14} />
                  <span>Gestión de Viajes</span>
                </div>
              </div>

              <div
                className={`nav-subitem ${activeTab === 'logistica' && activeSubTab === 'clientes' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('logistica', 'clientes', e)}
              >
                <div className="nav-subitem-content">
                  <Building2 size={14} />
                  <span>Catálogo de Clientes</span>
                </div>
              </div>

              <div
                className={`nav-subitem ${activeTab === 'logistica' && activeSubTab === 'conductores' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('logistica', 'conductores', e)}
              >
                <div className="nav-subitem-content">
                  <UserCheck size={14} />
                  <span>Conductores / Pilotos</span>
                </div>
              </div>

              <div
                className={`nav-subitem ${activeTab === 'logistica' && activeSubTab === 'vehiculos' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('logistica', 'vehiculos', e)}
              >
                <div className="nav-subitem-content">
                  <Car size={14} />
                  <span>Vehículos / Camiones</span>
                </div>
              </div>

              <div
                className={`nav-subitem ${activeTab === 'logistica' && activeSubTab === 'rollos' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('logistica', 'rollos', e)}
              >
                <div className="nav-subitem-content">
                  <Layers size={14} />
                  <span>Control de Rollos</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. GESTIÓN DE USUARIOS */}
      {hasUserPermission && (
        <div style={{ marginBottom: '0.25rem' }}>
          <div
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleModuleClick('users', 'usuarios')}
          >
            <div className="nav-item-content">
              <Users size={18} />
              <span>Gestión de Usuarios</span>
            </div>
            <div onClick={(e) => toggleChevron('users', e)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {pendientesCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.05rem 0.4rem',
                    borderRadius: '10px'
                  }}
                  title={`${pendientesCount} solicitudes pendientes`}
                >
                  {pendientesCount}
                </span>
              )}
              {expandedModules.users ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>

          {expandedModules.users && (
            <div className="nav-sub-container">
              <div
                className={`nav-subitem ${activeTab === 'users' && activeSubTab === 'usuarios' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('users', 'usuarios', e)}
              >
                <div className="nav-subitem-content">
                  <Users size={14} />
                  <span>Directorio de Usuarios</span>
                </div>
              </div>

              <div
                className={`nav-subitem ${activeTab === 'users' && activeSubTab === 'solicitudes' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('users', 'solicitudes', e)}
              >
                <div className="nav-subitem-content">
                  <KeyRound size={14} />
                  <span>Restablecimiento</span>
                </div>
                {pendientesCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.05rem 0.35rem',
                      borderRadius: '8px'
                    }}
                  >
                    {pendientesCount}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MÓDULO DE REPORTES Y ANALÍTICA */}
      {hasReportesPermission && (
        <div style={{ marginBottom: '0.25rem' }}>
          <div
            className={`nav-item ${activeTab === 'reportes' ? 'active' : ''}`}
            onClick={() => handleModuleClick('reportes', 'dashboard')}
          >
            <div className="nav-item-content">
              <BarChart3 size={18} style={{ color: 'var(--yellow)' }} />
              <span>Reportes y Analítica</span>
            </div>
            <div onClick={(e) => toggleChevron('reportes', e)} style={{ display: 'flex', alignItems: 'center' }}>
              {expandedModules.reportes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>

          {expandedModules.reportes && (
            <div className="nav-sub-container">
              <div
                className={`nav-subitem ${activeTab === 'reportes' && activeSubTab === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => handleSubTabClick('reportes', 'dashboard', e)}
              >
                <div className="nav-subitem-content">
                  <BarChart3 size={14} />
                  <span>Dashboard General</span>
                </div>
              </div>

              {hasBodegaPermission && (
                <div
                  className={`nav-subitem ${activeTab === 'reportes' && activeSubTab === 'bodega' ? 'active' : ''}`}
                  onClick={(e) => handleSubTabClick('reportes', 'bodega', e)}
                >
                  <div className="nav-subitem-content">
                    <Package size={14} />
                    <span>Reportes de Bodega</span>
                  </div>
                </div>
              )}

              {hasTallerPermission && (
                <div
                  className={`nav-subitem ${activeTab === 'reportes' && activeSubTab === 'taller' ? 'active' : ''}`}
                  onClick={(e) => handleSubTabClick('reportes', 'taller', e)}
                >
                  <div className="nav-subitem-content">
                    <Wrench size={14} />
                    <span>Reportes de Taller</span>
                  </div>
                </div>
              )}

              {hasLogisticaPermission && (
                <div
                  className={`nav-subitem ${activeTab === 'reportes' && activeSubTab === 'logistica' ? 'active' : ''}`}
                  onClick={(e) => handleSubTabClick('reportes', 'logistica', e)}
                >
                  <div className="nav-subitem-content">
                    <Truck size={14} />
                    <span>Reportes de Logística</span>
                  </div>
                </div>
              )}

              {hasUserPermission && (
                <div
                  className={`nav-subitem ${activeTab === 'reportes' && activeSubTab === 'bitacora' ? 'active' : ''}`}
                  onClick={(e) => handleSubTabClick('reportes', 'bitacora', e)}
                >
                  <div className="nav-subitem-content">
                    <FileText size={14} />
                    <span>Auditoría ISO 27001</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Rol: <strong style={{ color: 'var(--yellow)' }}>{role || 'Sin Rol'}</strong>
      </div>
    </aside>
  );
};

export default Sidebar;
