import React from 'react';
import { Navigation, Eye, PlusCircle, Download, RefreshCw } from 'lucide-react';

export const HeaderLogistica = ({
  activeSubTab,
  selectedViajeId,
  loading,
  onOpenViajeDetail,
  onOpenNewViaje,
  onOpenNewCliente,
  onOpenNewConductor,
  onOpenNewVehiculo,
  onOpenIngresoRollo,
  onOpenNewRollo,
  onReload
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)', fontWeight: 800, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
          <Navigation size={28} style={{ color: 'var(--blue)' }} />
          Módulo de Logística y Control de Viajes
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {activeSubTab === 'viajes' && (
          <>
            <button
              className="btn-secondary"
              onClick={onOpenViajeDetail}
              disabled={!selectedViajeId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: selectedViajeId ? 1 : 0.5,
                cursor: selectedViajeId ? 'pointer' : 'not-allowed'
              }}
            >
              <Eye size={16} />
              Más Información
            </button>
            <button
              className="btn-primary"
              onClick={onOpenNewViaje}
              style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={18} />
              Programar Nuevo Viaje
            </button>
          </>
        )}

        {activeSubTab === 'clientes' && (
          <button
            className="btn-primary"
            onClick={onOpenNewCliente}
            style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} />
            Nuevo Cliente
          </button>
        )}

        {activeSubTab === 'conductores' && (
          <button
            className="btn-primary"
            onClick={onOpenNewConductor}
            style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} />
            Nuevo Conductor
          </button>
        )}

        {activeSubTab === 'vehiculos' && (
          <button
            className="btn-primary"
            onClick={onOpenNewVehiculo}
            style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} />
            Nuevo Vehículo
          </button>
        )}

        {activeSubTab === 'rollos' && (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={onOpenIngresoRollo}
              style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--blue)' }}
              title="Ingresar rollos a bodega seleccionando un código de alambre pre-registrado existente"
            >
              <Download size={18} />
              Ingreso de Rollos
            </button>
            <button
              className="btn-action"
              onClick={onOpenNewRollo}
              style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              title="Registrar nuevos rollos con nuevo código correlativo"
            >
              <PlusCircle size={18} />
              Registrar Rollos
            </button>
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={onReload}
          title="Recargar Datos"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>
    </div>
  );
};
