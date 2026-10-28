import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar, Sidebar } from '@/components/layout';
import { CambioPasswordModal } from '@/components/common';
import { Login, UserManagement, RoleHomeView } from '@/modules/usuarios';
import { BodegaModule } from '@/modules/bodega';
import { TallerModule } from '@/modules/taller';
import { LogisticaModule } from '@/modules/logistica';
import { ReportesModule } from '@/modules/reportes';
import '@/styles/main.css';

const MainLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [activeSubTab, setActiveSubTab] = useState('usuarios');

  const handleSelectModule = (tab, subTab = null) => {
    setActiveTab(tab);
    if (subTab) {
      setActiveSubTab(subTab);
    } else {
      switch (tab) {
        case 'bodega':
          setActiveSubTab('inventario');
          break;
        case 'taller':
          setActiveSubTab('ordenes');
          break;
        case 'logistica':
          setActiveSubTab('viajes');
          break;
        case 'users':
          setActiveSubTab('usuarios');
          break;
        case 'reportes':
          setActiveSubTab('dashboard');
          break;
        default:
          break;
      }
    }
  };

  useEffect(() => {
    // Redirigir al módulo según el rol y permisos del usuario
    const hasUsersPermission = user?.permisos?.some(p => p.nombre_permiso === 'ver_usuarios');
    if (user?.rol) {
      if (!hasUsersPermission) {
        switch (user.rol) {
          case 'Bodeguero':
            handleSelectModule('bodega', 'inventario');
            break;
          case 'Taller':
            handleSelectModule('taller', 'ordenes');
            break;
          case 'Logística':
            handleSelectModule('logistica', 'viajes');
            break;
          default:
            setActiveTab('dashboard');
            break;
        }
      } else {
        handleSelectModule('users', 'usuarios');
      }
    }
  }, [user]);

  const renderContent = () => {
    if (activeTab === 'bodega') {
      return <BodegaModule activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />;
    }

    if (activeTab === 'taller') {
      return <TallerModule activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />;
    }

    if (activeTab === 'logistica') {
      return <LogisticaModule activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />;
    }

    if (activeTab === 'reportes') {
      return <ReportesModule activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />;
    }

    if (activeTab === 'users') {
      const hasUsersPermission = user?.permisos?.some(p => p.nombre_permiso === 'ver_usuarios');
      if (hasUsersPermission) {
        return <UserManagement activeMainTab={activeSubTab} setActiveMainTab={setActiveSubTab} />;
      } else {
        return <RoleHomeView user={user} activeTab={activeTab} />;
      }
    }

    return <RoleHomeView user={user} activeTab={activeTab} />;
  };

  return (
    <div className="app-container">
      <CambioPasswordModal />
      <Sidebar
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onSelectModule={handleSelectModule}
        setActiveTab={setActiveTab}
      />
      <div className="main-content">
        <Navbar />
        <main className="content-body">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-wrapper">
        <div style={{ color: 'var(--tm-yellow-bright)', fontSize: '1.1rem', fontWeight: 700 }}>
          Cargando Sistema de Gestión TM...
        </div>
      </div>
    );
  }

  return token ? <MainLayout /> : <Login />;
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
