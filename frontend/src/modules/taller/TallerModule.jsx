import React, { useState, useEffect, useRef } from 'react';
import { tallerService } from '@/services/tallerService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import CustomSelect from '@/components/common/CustomSelect';
import {
  Wrench,
  PlusCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  ShieldAlert,
  Users,
  FileText,
  PackageCheck,
  UserPlus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const TallerModule = ({ activeSubTab: externalSubTab, setActiveSubTab: externalSetSubTab }) => {
  const { user } = useAuth();

  // Restricción de acceso: Únicamente los roles 'Administrador' y 'Taller' tienen acceso
  const isAdmin = user?.rol === 'Administrador';
  const isTaller = user?.rol === 'Taller';
  const isAllowed = isAdmin || isTaller;

  // Notificaciones y confirmaciones del sistema
  const { toast, showToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Pestañas secundarias: 'ordenes' o 'mecanicos'
  const [internalSubTab, setInternalSubTab] = useState('ordenes');
  const activeSubTab = externalSubTab ?? internalSubTab;
  const setActiveSubTab = externalSetSubTab ?? setInternalSubTab;

  // Estados de datos
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [areaFilter, setAreaFilter] = useState('Todas');

  // Modales
  const [isNewOTModalOpen, setIsNewOTModalOpen] = useState(false);
  const [isNewMecanicoModalOpen, setIsNewMecanicoModalOpen] = useState(false);
  const [selectedOTDetail, setSelectedOTDetail] = useState(null);

  // Formulario para Nueva Orden de Trabajo
  const [otForm, setOtForm] = useState({
    numero_orden: '',
    vehiculo: '',
    mecanico: '',
    mecanico_asignado: '',
    area_asignada: 'General',
    estado: 'Abierta',
    descripcion: ''
  });

  // Formulario para Nuevo Mecánico
  const [mecanicoForm, setMecanicoForm] = useState({
    nombre: '',
    area: 'General'
  });

  // Cargar Órdenes de Trabajo desde el backend
  const fetchOrdenesTrabajo = async () => {
    try {
      const res = await tallerService.getOrdenesTrabajo({ search: searchTerm });
      setOrdenesTrabajo(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar órdenes de trabajo:", err);
      setOrdenesTrabajo([]);
    }
  };

  // Cargar Vehículos (solo para seleccionar en OT)
  const fetchVehiculos = async () => {
    try {
      const res = await tallerService.getVehiculos();
      setVehiculos(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
      setVehiculos([]);
    }
  };

  // Cargar Mecánicos del taller
  const fetchMecanicos = async () => {
    try {
      const res = await tallerService.getMecanicos();
      setMecanicos(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar mecánicos:", err);
      setMecanicos([]);
    }
  };

  // Cargar datos del módulo
  const loadData = async () => {
    setLoading(true);
    await fetchOrdenesTrabajo();
    await fetchVehiculos();
    await fetchMecanicos();
    setLoading(false);
  };

  useEffect(() => {
    if (isAllowed) {
      loadData();
    }
  }, [activeSubTab, searchTerm, isAllowed]);

  // Denegar acceso a usuarios sin rol de Taller o Administrador
  if (!isAllowed) {
    return (
      <div className="card" style={{ maxWidth: '520px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <ShieldAlert size={52} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.5rem' }}>
          Acceso Restringido al Módulo de Taller
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
          El Módulo de Taller está reservado únicamente para el personal con rol de <strong>Taller</strong> o <strong>Administrador</strong>.
        </p>
      </div>
    );
  }

  // Abrir modal de nueva OT y autogenerar correlativo
  const handleOpenNewOTModal = async () => {
    try {
      const res = await tallerService.getSiguienteCorrelativoOT();
      const primerMecanico = mecanicos.length > 0 ? mecanicos[0] : null;

      setOtForm({
        numero_orden: res.data.siguiente_correlativo || 'OT-1001',
        vehiculo: vehiculos.length > 0 ? vehiculos[0].id_vehiculo : '',
        mecanico: primerMecanico ? primerMecanico.id_mecanico : '',
        mecanico_asignado: primerMecanico ? primerMecanico.nombre : '',
        area_asignada: primerMecanico ? primerMecanico.area : 'General',
        estado: 'Abierta',
        descripcion: ''
      });
      setIsNewOTModalOpen(true);
    } catch (err) {
      console.error("Error al generar correlativo de OT:", err);
      setOtForm(prev => ({ ...prev, numero_orden: 'OT-1001' }));
      setIsNewOTModalOpen(true);
    }
  };

  // Al seleccionar un mecánico de la lista desplegable, auto-completar su área de trabajo
  const handleMecanicoSelectChange = (e) => {
    const mecanicoId = e.target.value;
    const mecSeleccionado = mecanicos.find(m => str(m.id_mecanico) === str(mecanicoId));
    if (mecSeleccionado) {
      setOtForm(prev => ({
        ...prev,
        mecanico: mecSeleccionado.id_mecanico,
        mecanico_asignado: mecSeleccionado.nombre,
        area_asignada: mecSeleccionado.area
      }));
    } else {
      setOtForm(prev => ({
        ...prev,
        mecanico: '',
        mecanico_asignado: '',
        area_asignada: 'General'
      }));
    }
  };

  // Al cambiar el Área de Trabajo / Especialidad, filtrar automáticamente la lista de mecánicos asignables
  const handleAreaSelectChange = (e) => {
    const nuevaArea = e.target.value;
    const mecsDelArea = (nuevaArea && nuevaArea !== 'General')
      ? mecanicos.filter(m => m.area === nuevaArea)
      : mecanicos;

    const currentMec = mecanicos.find(m => str(m.id_mecanico) === str(otForm.mecanico));
    const isCurrentMecValid = currentMec && (nuevaArea === 'General' || currentMec.area === nuevaArea);

    if (isCurrentMecValid) {
      setOtForm(prev => ({ ...prev, area_asignada: nuevaArea }));
    } else if (mecsDelArea.length > 0) {
      setOtForm(prev => ({
        ...prev,
        area_asignada: nuevaArea,
        mecanico: mecsDelArea[0].id_mecanico,
        mecanico_asignado: mecsDelArea[0].nombre
      }));
    } else {
      setOtForm(prev => ({
        ...prev,
        area_asignada: nuevaArea,
        mecanico: '',
        mecanico_asignado: ''
      }));
    }
  };

  // Auxiliar seguro para convertir a string en comparaciones
  const str = (val) => (val !== null && val !== undefined ? String(val) : '');

  // Guardar nueva Orden de Trabajo
  const handleSaveOT = async (e) => {
    e.preventDefault();
    if (!otForm.vehiculo) {
      showToast('warning', "Por favor seleccione un vehículo para la orden de trabajo.");
      return;
    }
    try {
      await tallerService.crearOrdenTrabajo(otForm);
      showToast('success', "Orden de Trabajo creada exitosamente.");
      setIsNewOTModalOpen(false);
      await fetchOrdenesTrabajo();
    } catch (err) {
      console.error("Error al crear la orden de trabajo:", err);
      showToast('error', "No se pudo crear la Orden de Trabajo. Verifique los datos ingresados.");
    }
  };

  // Cambiar el estado de una Orden de Trabajo desde la tabla o el modal
  const handleUpdateStatusOT = async (idOrden, nuevoEstado) => {
    const otActual = ordenesTrabajo.find(o => o.id_orden === idOrden) || selectedOTDetail;
    if (otActual?.estado === 'Cerrada' && nuevoEstado !== 'Cerrada') {
      showToast('warning', "Una orden de trabajo que ya fue cerrada no puede volver a ser abierta.");
      return;
    }

    try {
      await tallerService.actualizarEstadoOT(idOrden, nuevoEstado);
      showToast('success', `Estado actualizado a "${nuevoEstado}".`);
      await fetchOrdenesTrabajo();
      if (selectedOTDetail && selectedOTDetail.id_orden === idOrden) {
        setSelectedOTDetail(prev => ({ ...prev, estado: nuevoEstado }));
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      const errorMsg = err.response?.data?.estado?.[0] || err.response?.data?.detail || "No se pudo actualizar el estado de la orden de trabajo.";
      showToast('error', errorMsg);
    }
  };

  // Guardar nuevo mecánico en el sistema
  const handleSaveMecanico = async (e) => {
    e.preventDefault();
    if (!mecanicoForm.nombre.trim()) {
      showToast('warning', "El nombre del mecánico es obligatorio.");
      return;
    }
    try {
      await tallerService.crearMecanico(mecanicoForm);
      showToast('success', "Mecánico registrado exitosamente.");
      setIsNewMecanicoModalOpen(false);
      setMecanicoForm({ nombre: '', area: 'General' });
      await fetchMecanicos();
    } catch (err) {
      console.error("Error al registrar mecánico:", err);
      showToast('error', "No se pudo guardar el registro del mecánico.");
    }
  };

  // Filtrado de Órdenes por estado
  const filteredOTs = ordenesTrabajo.filter(ot => {
    if (statusFilter === 'Todas') return true;
    return ot.estado === statusFilter;
  });

  // Filtrado de Mecánicos por área
  const filteredMecanicos = mecanicos.filter(m => {
    if (areaFilter === 'Todas') return true;
    return m.area === areaFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado del Módulo de Taller */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Wrench size={28} style={{ color: 'var(--accent-yellow)' }} />
            Módulo de Taller y Mantenimiento
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Gestión de Órdenes de Trabajo (OT) y Especialidades de Mecánicos del Taller
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeSubTab === 'ordenes' && (
            <button
              className="btn-primary"
              onClick={handleOpenNewOTModal}
              style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={18} />
              Nueva Orden de Trabajo
            </button>
          )}

          {activeSubTab === 'mecanicos' && (
            <button
              className="btn-primary"
              onClick={() => setIsNewMecanicoModalOpen(true)}
              style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <UserPlus size={18} />
              Nuevo Mecánico
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={loadData}
            title="Recargar datos"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: ÓRDENES DE TRABAJO */}
      {activeSubTab === 'ordenes' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          
          {/* Búsqueda y Filtros de OT */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Buscar por correlativo OT, vehículo, mecánico o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.4rem', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.3rem' }}>Estado:</span>
              {['Todas', 'Abierta', 'Cerrada'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: statusFilter === st ? 700 : 500,
                    border: '1px solid',
                    borderColor: statusFilter === st ? 'var(--blue)' : 'var(--border)',
                    backgroundColor: statusFilter === st ? '#eff6ff' : 'transparent',
                    color: statusFilter === st ? '#1e40af' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Órdenes de Trabajo */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Correlativo OT</th>
                  <th style={{ padding: '0.75rem' }}>Vehículo</th>
                  <th style={{ padding: '0.75rem' }}>Mecánico Asignado</th>
                  <th style={{ padding: '0.75rem' }}>Área de Especialidad</th>
                  <th style={{ padding: '0.75rem' }}>Fecha Registro</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Repuestos Q</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOTs.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se encontraron Órdenes de Trabajo registradas.
                    </td>
                  </tr>
                ) : (
                  filteredOTs.map((ot) => (
                    <tr
                      key={ot.id_orden}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      className="table-row-hover"
                      onClick={() => setSelectedOTDetail(ot)}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent-yellow)' }}>
                        {ot.numero_orden}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {ot.vehiculo_detail ? (
                          <span>
                            <strong style={{ color: 'var(--white)' }}>{ot.vehiculo_detail.placa}</strong>{' '}
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({ot.vehiculo_detail.modelo || 'Sin modelo'})</span>
                          </span>
                        ) : 'Sin Vehículo'}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--white)' }}>
                        {ot.mecanico_detail ? ot.mecanico_detail.nombre : (ot.mecanico_asignado || 'No Asignado')}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {ot.mecanico_detail ? ot.mecanico_detail.area : (ot.area_asignada || 'General')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(ot.fecha_creacion).toLocaleDateString()} {new Date(ot.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor:
                              (ot.estado === 'Cerrada' || ot.estado === 'Finalizada') ? '#ecfdf5' : '#eff6ff',
                            color:
                              (ot.estado === 'Cerrada' || ot.estado === 'Finalizada') ? '#059669' : '#1e40af',
                            border: `1px solid ${
                              (ot.estado === 'Cerrada' || ot.estado === 'Finalizada') ? '#a7f3d0' : '#bfdbfe'
                            }`
                          }}
                        >
                          {ot.estado}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--white)' }}>
                        Q {Number(ot.total_repuestos_q || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOTDetail(ot);
                          }}
                          title="Consultar Detalle y Repuestos"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem' }}
                        >
                          <Eye size={14} />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: GESTIÓN DE MECÁNICOS Y ÁREAS */}
      {activeSubTab === 'mecanicos' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)' }}>
              Plantilla de Mecánicos de Taller por Área
            </h3>

            {/* Filtros por Área de Especialidad */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.3rem' }}>Área:</span>
              {['Todas', 'Soldadura', 'Electromecánico', 'Tapicería', 'Llantero', 'General'].map((a) => (
                <button
                  key={a}
                  onClick={() => setAreaFilter(a)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: areaFilter === a ? 700 : 500,
                    border: '1px solid',
                    borderColor: areaFilter === a ? 'var(--accent-yellow)' : 'var(--border-color)',
                    backgroundColor: areaFilter === a ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                    color: areaFilter === a ? 'var(--accent-yellow)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>Nombre Completo</th>
                  <th style={{ padding: '0.75rem' }}>Área de Especialidad</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredMecanicos.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay mecánicos registrados para el área seleccionada.
                    </td>
                  </tr>
                ) : (
                  filteredMecanicos.map((m) => (
                    <tr key={m.id_mecanico} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>#{m.id_mecanico}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--white)' }}>{m.nombre}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            backgroundColor:
                              m.area === 'Soldadura' ? 'rgba(245, 158, 11, 0.15)' :
                              m.area === 'Electromecánico' ? 'rgba(59, 130, 246, 0.15)' :
                              m.area === 'Tapicería' ? 'rgba(168, 85, 247, 0.15)' :
                              m.area === 'Llantero' ? 'rgba(236, 72, 153, 0.15)' :
                              'rgba(16, 185, 129, 0.15)',
                            color:
                              m.area === 'Soldadura' ? '#f59e0b' :
                              m.area === 'Electromecánico' ? '#3b82f6' :
                              m.area === 'Tapicería' ? '#a855f7' :
                              m.area === 'Llantero' ? '#ec4899' :
                              '#10b981',
                            border: '1px solid currentColor'
                          }}
                        >
                          {m.area}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>● Activo</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: NUEVA ORDEN DE TRABAJO */}
      {isNewOTModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} style={{ color: 'var(--blue)' }} />
                Crear Nueva Orden de Trabajo (OT)
              </h2>
              <button
                onClick={() => setIsNewOTModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOT}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Correlativo OT *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={otForm.numero_orden}
                    onChange={(e) => setOtForm({ ...otForm, numero_orden: e.target.value })}
                    required
                    style={{ fontWeight: 700, color: 'var(--yellow)', paddingLeft: '0.6rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Vehículo de Flotilla *</label>
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Seleccionar Vehículo --' },
                      ...vehiculos.map((v) => ({
                        value: v.id_vehiculo,
                        label: `${v.placa} - ${v.modelo || 'Sin modelo'} (${v.estado})`
                      }))
                    ]}
                    value={otForm.vehiculo}
                    onChange={(e) => setOtForm({ ...otForm, vehiculo: e.target.value })}
                    placeholder="-- Seleccionar Vehículo --"
                    required
                    maxHeight={200}
                  />
                </div>
              </div>

              {/* Selección de Mecánico del Taller (Filtrado dinámicamente por área seleccionada) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mecánico Asignado</label>
                  {(() => {
                    const mecsDisponibles = (otForm.area_asignada && otForm.area_asignada !== 'General')
                      ? mecanicos.filter(m => m.area === otForm.area_asignada)
                      : mecanicos;

                    return (
                      <CustomSelect
                        options={[
                          { value: '', label: mecsDisponibles.length > 0 ? '-- Seleccionar Mecánico --' : '-- Sin mecánicos en esta área --' },
                          ...mecsDisponibles.map((m) => ({
                            value: m.id_mecanico,
                            label: `${m.nombre} (${m.area})`
                          }))
                        ]}
                        value={otForm.mecanico}
                        onChange={handleMecanicoSelectChange}
                        placeholder="-- Seleccionar Mecánico --"
                        maxHeight={200}
                      />
                    );
                  })()}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Área de Trabajo / Especialidad</label>
                  <select
                    className="form-select"
                    value={otForm.area_asignada}
                    onChange={handleAreaSelectChange}
                  >
                    <option value="Soldadura">Soldadura</option>
                    <option value="Electromecánico">Electromecánico</option>
                    <option value="Tapicería">Tapicería</option>
                    <option value="Llantero">Llantero</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estado Inicial de la Orden</label>
                <select
                  className="form-select"
                  value={otForm.estado}
                  onChange={(e) => setOtForm({ ...otForm, estado: e.target.value })}
                >
                  <option value="Abierta">Abierta</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción del Mantenimiento / Trabajo Requerido</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Describa el trabajo a realizar en el vehículo..."
                  value={otForm.descripcion}
                  onChange={(e) => setOtForm({ ...otForm, descripcion: e.target.value })}
                  style={{ resize: 'vertical', padding: '0.6rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsNewOTModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Crear Orden de Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONSULTA DETALLADA DE OT Y REPUESTOS RELACIONADOS */}
      {selectedOTDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--yellow)' }}>
                    Orden de Trabajo: {selectedOTDetail.numero_orden}
                  </h2>
                  <span
                    style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor:
                        (selectedOTDetail.estado === 'Cerrada' || selectedOTDetail.estado === 'Finalizada') ? '#ecfdf5' : '#eff6ff',
                      color:
                        (selectedOTDetail.estado === 'Cerrada' || selectedOTDetail.estado === 'Finalizada') ? '#059669' : '#1e40af',
                      border: `1px solid ${
                        (selectedOTDetail.estado === 'Cerrada' || selectedOTDetail.estado === 'Finalizada') ? '#a7f3d0' : '#bfdbfe'
                      }`
                    }}
                  >
                    {selectedOTDetail.estado}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Registrado el {new Date(selectedOTDetail.fecha_creacion).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setSelectedOTDetail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-element)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Vehículo</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
                  {selectedOTDetail.vehiculo_detail ? `${selectedOTDetail.vehiculo_detail.placa} (${selectedOTDetail.vehiculo_detail.modelo || 'Sin modelo'})` : 'No asignado'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Mecánico Asignado</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
                  {selectedOTDetail.mecanico_detail ? selectedOTDetail.mecanico_detail.nombre : (selectedOTDetail.mecanico_asignado || 'No Asignado')}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Área / Especialidad</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
                  {selectedOTDetail.mecanico_detail ? selectedOTDetail.mecanico_detail.area : (selectedOTDetail.area_asignada || 'General')}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Costo Acumulado Repuestos</span>
                <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>
                  Q {Number(selectedOTDetail.total_repuestos_q || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Descripción del Mantenimiento / Trabajo
              </label>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.88rem', color: 'var(--white)', border: '1px solid var(--border)', minHeight: '50px' }}>
                {selectedOTDetail.descripcion || 'Sin descripción detallada.'}
              </div>
            </div>

            {/* SECCIÓN DE SALIDA DE REPUESTOS RELACIONADOS */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <PackageCheck size={18} style={{ color: 'var(--yellow)' }} />
                  Repuestos Entregados desde Bodega
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedOTDetail.salidas_repuesto?.length || 0} registro(s)
                </span>
              </div>

              {(!selectedOTDetail.salidas_repuesto || selectedOTDetail.salidas_repuesto.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--bg-element)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No se han registrado salidas de repuestos desde Bodega para esta Orden de Trabajo.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.6rem' }}>Repuesto</th>
                        <th style={{ padding: '0.6rem' }}>Código</th>
                        <th style={{ padding: '0.6rem', textAlign: 'center' }}>Cant.</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>P. Unit Q</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Subtotal Q</th>
                        <th style={{ padding: '0.6rem' }}>Fecha Despacho</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOTDetail.salidas_repuesto.map((salida) => {
                        const subtotal = Number(salida.cantidad * (salida.precio_unitario || 0));
                        return (
                          <tr key={salida.id_salida} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--white)' }}>
                              {salida.repuesto_nombre}
                            </td>
                            <td style={{ padding: '0.6rem', color: 'var(--yellow)', fontWeight: 600 }}>
                              {salida.repuesto_codigo || 'N/A'}
                            </td>
                            <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700, color: 'var(--white)' }}>
                              {salida.cantidad}
                            </td>
                            <td style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                              Q {Number(salida.precio_unitario || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                              Q {subtotal.toFixed(2)}
                            </td>
                            <td style={{ padding: '0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              {new Date(salida.fecha).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: selectedOTDetail.estado === 'Cerrada' ? 'flex-end' : 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              {selectedOTDetail.estado !== 'Cerrada' && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Acciones:</span>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setConfirmDialog({
                        title: "Cerrar Orden de Trabajo",
                        message: "¿Está seguro de cerrar esta Orden de Trabajo? Una vez cerrada, esta no podrá volver a ser abierta.",
                        confirmText: "Cerrar Orden",
                        confirmColor: "var(--success)",
                        onConfirm: () => handleUpdateStatusOT(selectedOTDetail.id_orden, 'Cerrada')
                      });
                    }}
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      color: 'var(--success)',
                      borderColor: '#a7f3d0',
                      backgroundColor: '#ecfdf5',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    Cerrar Orden
                  </button>
                </div>
              )}

              <button
                className="btn-secondary"
                onClick={() => setSelectedOTDetail(null)}
              >
                Cerrar Detalle
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRO DE NUEVO MECÁNICO DE TALLER */}
      {isNewMecanicoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} style={{ color: 'var(--blue)' }} />
                Registrar Nuevo Mecánico de Taller
              </h2>
              <button
                onClick={() => setIsNewMecanicoModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMecanico}>
              <div className="form-group">
                <label className="form-label">Nombre Completo del Mecánico *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Juan Pérez"
                  style={{ paddingLeft: '0.6rem' }}
                  value={mecanicoForm.nombre}
                  onChange={(e) => setMecanicoForm({ ...mecanicoForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Área de Especialidad *</label>
                <select
                  className="form-select"
                  value={mecanicoForm.area}
                  onChange={(e) => setMecanicoForm({ ...mecanicoForm, area: e.target.value })}
                >
                  <option value="Soldadura">Soldadura</option>
                  <option value="Electromecánico">Electromecánico</option>
                  <option value="Tapicería">Tapicería</option>
                  <option value="Llantero">Llantero</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsNewMecanicoModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Guardar Mecánico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIÁLOGO CONFIRMACIÓN GENERAL DEL SISTEMA (Reemplaza confirm nativo del navegador) */}
      {confirmDialog && (
        <div className="modal-overlay" style={{ zIndex: 10001 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '92%', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: confirmDialog.confirmColor === 'var(--danger)' ? '#fee2e2' : '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: confirmDialog.confirmColor === 'var(--danger)' ? 'var(--danger)' : 'var(--blue)',
                flexShrink: 0
              }}>
                <AlertCircle size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--white)' }}>
                {confirmDialog.title}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.35rem', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setConfirmDialog(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  backgroundColor: confirmDialog.confirmColor || 'var(--blue)',
                  borderColor: 'transparent'
                }}
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  if (action) await action();
                }}
              >
                {confirmDialog.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN TOAST DEL SISTEMA (Reemplaza alert nativo del navegador) */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: toast.type === 'success' ? '#15803d' : toast.type === 'error' ? '#b91c1c' : '#d97706',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.15)',
            fontSize: '0.875rem',
            fontWeight: 500,
            maxWidth: '440px'
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={20} style={{ flexShrink: 0 }} />}
          {toast.type === 'error' && <AlertCircle size={20} style={{ flexShrink: 0 }} />}
          {toast.type === 'warning' && <AlertCircle size={20} style={{ flexShrink: 0 }} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              opacity: 0.85
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
};
