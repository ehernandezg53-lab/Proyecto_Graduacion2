import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart3,
  RefreshCw
} from 'lucide-react';
import reportesService from '@/services/reportesService';
import DashboardKpis from './components/DashboardKpis';
import BodegaReportsView from './components/BodegaReportsView';
import TallerReportsView from './components/TallerReportsView';
import LogisticaReportsView from './components/LogisticaReportsView';
import BitacoraReportsView from './components/BitacoraReportsView';
import './styles/reportes.css';

export const ReportesModule = ({ activeSubTab = 'dashboard', setActiveSubTab }) => {
  const { user } = useAuth();
  const role = user?.rol;

  // Permisos según rol
  const isAdmin = role === 'Administrador';
  const hasBodega = isAdmin || role === 'Bodeguero' || user?.permisos?.some((p) => p.nombre_permiso === 'ver_bodega');
  const hasTaller = isAdmin || role === 'Taller' || user?.permisos?.some((p) => p.nombre_permiso === 'ver_taller');
  const hasLogistica = isAdmin || role === 'Logística' || user?.permisos?.some((p) => p.nombre_permiso === 'ver_logistica');
  const hasBitacora = isAdmin || user?.permisos?.some((p) => p.nombre_permiso === 'ver_usuarios');

  // Estado local si setActiveSubTab no viene del padre
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'dashboard');
  const [kpis, setKpis] = useState(null);
  const [loadingKpis, setLoadingKpis] = useState(false);

  const selectedTab = setActiveSubTab ? activeSubTab : currentTab;
  const changeTab = (tab) => {
    if (setActiveSubTab) {
      setActiveSubTab(tab);
    } else {
      setCurrentTab(tab);
    }
  };

  const loadKpis = async () => {
    setLoadingKpis(true);
    try {
      const data = await reportesService.getDashboardKpis();
      setKpis(data);
    } catch (err) {
      console.error('Error al cargar KPIs del centro de reportes:', err);
    } finally {
      setLoadingKpis(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, []);

  // Si el usuario no tiene permiso para el tab actual, redirigir al primero permitido
  useEffect(() => {
    if (selectedTab === 'bodega' && !hasBodega) changeTab('dashboard');
    if (selectedTab === 'taller' && !hasTaller) changeTab('dashboard');
    if (selectedTab === 'logistica' && !hasLogistica) changeTab('dashboard');
    if (selectedTab === 'bitacora' && !hasBitacora) changeTab('dashboard');
  }, [selectedTab, hasBodega, hasTaller, hasLogistica, hasBitacora]);

  return (
    <div className="reportes-container">
      {/* Encabezado General */}
      <div className="reportes-header">
        <div>
          <h1>
            <BarChart3 size={24} style={{ color: 'var(--yellow)' }} />
            Centro de Reportes y Analítica
          </h1>
          <p>
            Consultas consolidadas, análisis de rendimiento y exportación formal en Excel y PDF para el Sistema TM.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-action"
            onClick={loadKpis}
            disabled={loadingKpis}
            title="Actualizar indicadores"
          >
            <RefreshCw size={14} className={loadingKpis ? 'animate-spin' : ''} />
            Actualizar KPIs
          </button>
        </div>
      </div>

      {/* Renderizado de Vistas según Tab Activo de la Barra Lateral */}
      {selectedTab === 'dashboard' && (
        <DashboardKpis
          kpis={kpis}
          onNavigate={(targetModule) => changeTab(targetModule)}
        />
      )}

      {selectedTab === 'bodega' && hasBodega && <BodegaReportsView />}

      {selectedTab === 'taller' && hasTaller && <TallerReportsView />}

      {selectedTab === 'logistica' && hasLogistica && <LogisticaReportsView />}

      {selectedTab === 'bitacora' && hasBitacora && <BitacoraReportsView />}
    </div>
  );
};

export default ReportesModule;
