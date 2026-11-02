import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { logisticaService } from '@/services/logisticaService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { CustomSelect, ConfirmDialog, ToastNotification } from '@/components/common';
import {
  ModalDetalleViaje,
  ModalProgramarViaje,
  ModalCliente,
  ModalConductor,
  ModalVehiculo,
  ModalNuevoCodigoRollo,
  ModalIngresoRollos,
  HeaderLogistica,
  TabViajes,
  TabClientes,
  TabConductores,
  TabVehiculos,
  TabRollos
} from './components';
import { ShieldAlert } from 'lucide-react';

const DEFAULT_TIPOS_ALAMBRE = [
  { id_tipo: 1, codigo: 'AL-72150', nombre: 'Alambre Galvanizado Calibre 12', peso_estandar_kg: 50.00, ubicacion_defecto: 'Bodega Central - Bahía A' },
  { id_tipo: 2, codigo: 'AL-72151', nombre: 'Alambre Galvanizado Calibre 14', peso_estandar_kg: 50.00, ubicacion_defecto: 'Bodega Central - Bahía A' },
  { id_tipo: 3, codigo: 'AL-72152', nombre: 'Alambre Galvanizado Calibre 16', peso_estandar_kg: 50.00, ubicacion_defecto: 'Bodega Central - Bahía B' },
  { id_tipo: 4, codigo: 'AL-72153', nombre: 'Alambre de Púa Alta Resistencia', peso_estandar_kg: 35.00, ubicacion_defecto: 'Bodega Central - Bahía C' },
  { id_tipo: 5, codigo: 'AL-72154', nombre: 'Alambre Recocido para Amarre', peso_estandar_kg: 50.00, ubicacion_defecto: 'Bodega Central - Bahía B' },
  { id_tipo: 6, codigo: 'AL-72155', nombre: 'Alambre de Acero Estructural', peso_estandar_kg: 100.00, ubicacion_defecto: 'Bodega Central - Bahía D' },
];

export const LogisticaModule = ({ activeSubTab: externalSubTab, setActiveSubTab: externalSetSubTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Administrador';
  const isLogistica = user?.rol === 'Logística';
  const isAllowed = isAdmin || isLogistica;

  // Notificaciones y confirmaciones del sistema
  const { toast, showToast } = useToast();

  const [confirmDialog, setConfirmDialog] = useState(null);

  // Pestaña activa: 'viajes', 'clientes', 'conductores', 'vehiculos', 'rollos'
  const [internalSubTab, setInternalSubTab] = useState('viajes');
  const activeSubTab = externalSubTab ?? internalSubTab;
  const setActiveSubTab = externalSetSubTab ?? setInternalSubTab;

  // Estados de datos
  const [viajes, setViajes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [progDesde, setProgDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // Fila de viaje seleccionada (Checkbox)
  const [selectedViajeId, setSelectedViajeId] = useState(null);

  // Modales
  const [isNewViajeModalOpen, setIsNewViajeModalOpen] = useState(false);
  const [isNewClienteModalOpen, setIsNewClienteModalOpen] = useState(false);
  const [isNewConductorModalOpen, setIsNewConductorModalOpen] = useState(false);
  const [isNewVehiculoModalOpen, setIsNewVehiculoModalOpen] = useState(false);
  const [selectedViajeDetail, setSelectedViajeDetail] = useState(null);

  // Formulario para Nuevo/Editar Vehículo
  const [editingVehiculoId, setEditingVehiculoId] = useState(null);
  const [vehiculoForm, setVehiculoForm] = useState({
    unidad: '',
    placa: '',
    activo: true
  });

  // Formulario para Nuevo/Editar Cliente
  const [editingClienteId, setEditingClienteId] = useState(null);
  const [clienteForm, setClienteForm] = useState({
    numero_cliente: '',
    nombre: '',
    direccion: ''
  });

  // Formulario para Nuevo Viaje
  const [viajeForm, setViajeForm] = useState({
    numero_viaje: '',
    vehiculo: '',
    cliente: '',
    conductor: '',
    fecha_envio: new Date().toISOString().split('T')[0],
    hora_envio: '08:00',
    peso_carga_kg: 1000,
    cantidad_rollos: 10,
    estado: 'Abierta'
  });

  // Formulario para Nuevo/Editar Conductor
  const [editingConductorId, setEditingConductorId] = useState(null);
  const [conductorForm, setConductorForm] = useState({
    codigo_carnet: '',
    nombre: '',
    fecha_vencimiento_licencia: ''
  });

  // Estados para Control e Inventario de Rollos de Alambre
  const [rollos, setRollos] = useState([]);
  const [rollosDisponibles, setRollosDisponibles] = useState([]);
  const [rollosMetricas, setRollosMetricas] = useState({
    total_rollos: 0,
    disponibles: 0,
    en_viaje: 0,
    entregados: 0,
    peso_disponible_kg: 0
  });
  const [rolloSearch, setRolloSearch] = useState('');
  const [rolloFilterEstado, setRolloFilterEstado] = useState('Todos');
  const [tiposAlambre, setTiposAlambre] = useState(DEFAULT_TIPOS_ALAMBRE);
  const [isNewRolloModalOpen, setIsNewRolloModalOpen] = useState(false);
  const [isIngresoRolloModalOpen, setIsIngresoRolloModalOpen] = useState(false);
  const [selectedRollosIds, setSelectedRollosIds] = useState([]);
  const [newRolloCodeForm, setNewRolloCodeForm] = useState({
    codigo: '',
    nombre: '',
    peso_estandar_kg: 50.00
  });
  const [ingresoRolloForm, setIngresoRolloForm] = useState({
    codigo_alambre: 'AL-72150',
    cantidad: 10,
    ubicacion: 'Bodega Central - Bahía A'
  });

  // Cargar Viajes desde Backend
  const fetchViajes = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (progDesde) params.prog_desde = progDesde;
      if (hasta) params.hasta = hasta;

      const res = await api.get('/logistica/viajes/', { params });
      setViajes(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar viajes:", err);
      setViajes([]);
    }
  };

  // Cargar Clientes desde Backend
  const fetchClientes = async () => {
    try {
      const res = await api.get('/logistica/clientes/', { params: { search: searchTerm } });
      setClientes(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      setClientes([]);
    }
  };

  // Cargar Conductores desde Backend
  const fetchConductores = async () => {
    try {
      const res = await api.get('/logistica/conductores/', { params: { search: searchTerm } });
      setConductores(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar conductores:", err);
      setConductores([]);
    }
  };

  // Cargar Vehículos de Flotilla
  const fetchVehiculos = async () => {
    try {
      const params = {};
      if (searchTerm && activeSubTab === 'vehiculos') params.search = searchTerm;
      const res = await api.get('/logistica/vehiculos/', { params });
      setVehiculos(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
      setVehiculos([]);
    }
  };

  // Cargar Rollos de Alambre
  const fetchRollos = async () => {
    try {
      const params = {};
      if (rolloSearch && activeSubTab === 'rollos') params.search = rolloSearch;
      if (rolloFilterEstado !== 'Todos' && activeSubTab === 'rollos') params.estado = rolloFilterEstado;
      const res = await api.get('/logistica/rollos/', { params });
      setRollos(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error al cargar rollos:", err);
      setRollos([]);
    }
  };

  const fetchRollosMetricas = async () => {
    try {
      const res = await api.get('/logistica/rollos/metricas/');
      setRollosMetricas(res.data);
    } catch (err) {
      console.error("Error al cargar métricas de rollos:", err);
    }
  };

  const fetchRollosDisponibles = async () => {
    try {
      const res = await api.get('/logistica/rollos/disponibles/');
      setRollosDisponibles(res.data);
      return res.data;
    } catch (err) {
      console.error("Error al cargar rollos disponibles:", err);
      return [];
    }
  };

  const fetchTiposAlambre = async () => {
    try {
      const res = await api.get('/logistica/tipos-alambre/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      if (data && data.length > 0) {
        setTiposAlambre(data);
      }
    } catch (err) {
      console.error("Error al cargar catálogo de tipos de alambre:", err);
    }
  };

  // Cargar todo los datos de la pestaña actual
  const loadTabData = async () => {
    setLoading(true);
    if (activeSubTab === 'viajes') {
      await fetchViajes();
      await fetchClientes();
      await fetchVehiculos();
      await fetchConductores();
      await fetchRollosDisponibles();
    } else if (activeSubTab === 'rollos') {
      await fetchRollos();
      await fetchRollosMetricas();
      await fetchTiposAlambre();
    } else if (activeSubTab === 'clientes') {
      await fetchClientes();
    } else if (activeSubTab === 'conductores') {
      await fetchConductores();
    } else if (activeSubTab === 'vehiculos') {
      await fetchVehiculos();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAllowed) {
      loadTabData();
    }
  }, [activeSubTab, searchTerm, rolloSearch, rolloFilterEstado, progDesde, hasta, isAllowed]);

  if (!isAllowed) {
    return (
      <div className="card" style={{ maxWidth: '520px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <ShieldAlert size={52} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.5rem' }}>
          Acceso Restringido al Módulo de Logística
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
          El Módulo de Logística está reservado únicamente para el personal con rol de <strong>Logística</strong> o <strong>Administrador</strong>.
        </p>
      </div>
    );
  }

  // --- MANEJO DE VIAJES ---
  const handleOpenNewViajeModal = async () => {
    try {
      const res = await api.get('/logistica/viajes/siguiente_correlativo/');
      const primerVehiculoActivo = vehiculos.find(v => v.activo !== false);
      const primerVehiculo = primerVehiculoActivo ? primerVehiculoActivo.id_vehiculo : '';
      const primerCliente = clientes.length > 0 ? clientes[0].id_cliente : '';

      const fechaHoy = new Date().toISOString().split('T')[0];

      // Cargar rollos disponibles de inmediato
      let dispRollos = [];
      try {
        const resRollos = await api.get('/logistica/rollos/disponibles/');
        dispRollos = resRollos.data || [];
        setRollosDisponibles(dispRollos);
      } catch (e) {
        console.error("Error al cargar rollos disponibles:", e);
      }

      // Inicializar sin preselección para permitir seleccionar libremente
      setSelectedRollosIds([]);

      setViajeForm({
        numero_viaje: res.data.siguiente_correlativo || '612150',
        vehiculo: primerVehiculo,
        cliente: primerCliente,
        conductor: '',
        fecha_envio: fechaHoy,
        hora_envio: '08:30',
        peso_carga_kg: 0,
        cantidad_rollos: 0,
        estado: 'Abierta'
      });
      setIsNewViajeModalOpen(true);
    } catch (err) {
      console.error("Error al preparar nuevo viaje:", err);
      setViajeForm(prev => ({ ...prev, numero_viaje: '612150' }));
      setIsNewViajeModalOpen(true);
    }
  };

  const handleToggleRolloSelection = (rollo) => {
    const isSelected = selectedRollosIds.includes(rollo.id_rollo);
    let newIds = [];
    if (isSelected) {
      newIds = selectedRollosIds.filter(id => id !== rollo.id_rollo);
    } else {
      newIds = [...selectedRollosIds, rollo.id_rollo];
    }
    setSelectedRollosIds(newIds);

    // Recalcular cantidad y peso acumulado
    const selectedObj = rollosDisponibles.filter(r => newIds.includes(r.id_rollo));
    const totalPeso = selectedObj.reduce((sum, r) => sum + Number(r.peso_kg || 0), 0);
    setViajeForm(prev => ({
      ...prev,
      cantidad_rollos: newIds.length,
      peso_carga_kg: Math.round(totalPeso * 100) / 100
    }));
  };

  const executeSaveViaje = async () => {
    try {
      const payload = {
        ...viajeForm,
        rollos_ids: selectedRollosIds,
        cantidad_rollos: selectedRollosIds.length > 0 ? selectedRollosIds.length : viajeForm.cantidad_rollos,
        peso_carga_kg: viajeForm.peso_carga_kg
      };
      await api.post('/logistica/viajes/', payload);
      showToast('success', "Viaje programado exitosamente.");
      setIsNewViajeModalOpen(false);
      await fetchViajes();
      await fetchRollos();
      await fetchRollosMetricas();
      await fetchRollosDisponibles();
    } catch (err) {
      console.error("Error al guardar viaje:", err);
      const data = err.response?.data;
      let msg = "No se pudo guardar el viaje. Verifique los datos ingresados.";
      if (data) {
        if (data.rollos_ids) msg = Array.isArray(data.rollos_ids) ? data.rollos_ids.join('\n') : data.rollos_ids;
        else if (data.cantidad_rollos) msg = Array.isArray(data.cantidad_rollos) ? data.cantidad_rollos.join('\n') : data.cantidad_rollos;
        else if (data.vehiculo) msg = Array.isArray(data.vehiculo) ? data.vehiculo.join('\n') : data.vehiculo;
        else if (data.conductor) msg = Array.isArray(data.conductor) ? data.conductor.join('\n') : data.conductor;
        else if (data.non_field_errors) msg = Array.isArray(data.non_field_errors) ? data.non_field_errors.join('\n') : data.non_field_errors;
      }
      showToast('error', msg);
    }
  };

  const handleSaveViaje = async (e) => {
    e.preventDefault();
    if (!viajeForm.vehiculo) {
      showToast('warning', "Por favor seleccione una unidad vehicular.");
      return;
    }

    // Validar que la unidad esté activa
    const vehiculoSeleccionado = vehiculos.find(v => String(v.id_vehiculo) === String(viajeForm.vehiculo));
    if (vehiculoSeleccionado && vehiculoSeleccionado.activo === false) {
      const nombreUnidad = vehiculoSeleccionado.unidad || vehiculoSeleccionado.modelo || 'Unidad';
      showToast('warning', `La unidad "${vehiculoSeleccionado.placa} (${nombreUnidad})" está inactiva. No se puede generar el viaje con una unidad inactiva. Por favor seleccione una unidad activa.`);
      return;
    }

    if (!viajeForm.cliente) {
      showToast('warning', "Por favor seleccione un cliente.");
      return;
    }

    // Validar que se asigne un conductor y que su licencia esté vigente
    if (!viajeForm.conductor) {
      showToast('warning', "Debe asignar un conductor al viaje.");
      return;
    }

    const conductorSeleccionado = conductores.find(c => String(c.id_conductor) === String(viajeForm.conductor));
    if (conductorSeleccionado) {
      if (conductorSeleccionado.activo === false) {
        showToast('warning', `El conductor "${conductorSeleccionado.nombre}" se encuentra inactivo. Debe asignar otro conductor.`);
        return;
      }
      if (!conductorSeleccionado.fecha_vencimiento_licencia) {
        showToast('warning', `El conductor "${conductorSeleccionado.nombre}" no tiene fecha de vencimiento de licencia registrada. Debe asignar un piloto con licencia válida.`);
        return;
      }
      if (conductorSeleccionado.fecha_vencimiento_licencia < viajeForm.fecha_envio) {
        const fechaCad = new Date(conductorSeleccionado.fecha_vencimiento_licencia + 'T00:00:00').toLocaleDateString();
        showToast('warning', `No se puede generar el viaje: La licencia de "${conductorSeleccionado.nombre}" está vencida (Caducó el ${fechaCad}). Debe asignar otro piloto con licencia vigente.`);
        return;
      }
    }

    if (selectedRollosIds.length === 0 && viajeForm.cantidad_rollos === 0) {
      setConfirmDialog({
        title: "Confirmar creación sin carga",
        message: "No ha asignado ningún rollo de alambre a este viaje. ¿Desea crearlo sin carga asignada?",
        confirmText: "Crear sin Carga",
        confirmColor: "var(--blue)",
        onConfirm: () => executeSaveViaje()
      });
      return;
    }

    await executeSaveViaje();
  };

  const handleUpdateStatusViaje = async (idViaje, nuevoEstado) => {
    try {
      await api.patch(`/logistica/viajes/${idViaje}/`, { estado: nuevoEstado });
      showToast('success', `Estado del viaje actualizado a ${nuevoEstado}.`);
      await fetchViajes();
      await fetchRollos();
      await fetchRollosMetricas();
      setSelectedViajeDetail(prev => prev ? { ...prev, estado: nuevoEstado } : null);
    } catch (err) {
      console.error("Error al actualizar estado del viaje:", err);
      showToast('error', "No se pudo actualizar el estado del viaje.");
    }
  };

  // Abrir Modal "Más Información" del viaje seleccionado
  const handleOpenSelectedViajeDetail = () => {
    if (!selectedViajeId) {
      showToast('warning', "Por favor marque la casilla (checkbox) de un viaje para ver más información.");
      return;
    }
    const viajeEncontrado = viajes.find(v => v.id_viaje === selectedViajeId);
    if (viajeEncontrado) {
      setSelectedViajeDetail(viajeEncontrado);
    }
  };

  // --- MANEJO DE CONTROL DE ROLLOS ---
  const handleOpenNewRolloModal = async () => {
    try {
      const res = await api.get('/logistica/tipos-alambre/siguiente_codigo/');
      setNewRolloCodeForm({
        codigo: res.data?.siguiente_codigo || 'AL-72156',
        nombre: '',
        peso_estandar_kg: 50.00
      });
    } catch (e) {
      setNewRolloCodeForm({
        codigo: 'AL-72156',
        nombre: '',
        peso_estandar_kg: 50.00
      });
    }
    setIsNewRolloModalOpen(true);
  };

  const handleOpenIngresoRolloModal = () => {
    const primerTipo = tiposAlambre[0] || DEFAULT_TIPOS_ALAMBRE[0];
    setIngresoRolloForm({
      codigo_alambre: primerTipo.codigo,
      cantidad: 10,
      ubicacion: primerTipo.ubicacion_defecto || 'Bodega Central - Bahía A'
    });
    setIsIngresoRolloModalOpen(true);
  };

  const handleSaveIngresoRolloExistente = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/logistica/rollos/ingreso_existente/', ingresoRolloForm);
      showToast('success', res.data.mensaje || "Rollos ingresados correctamente al inventario.");
      setIsIngresoRolloModalOpen(false);
      await fetchRollos();
      await fetchRollosMetricas();
      await fetchRollosDisponibles();
    } catch (err) {
      console.error("Error al registrar ingreso de rollos con código existente:", err);
      showToast('error', err.response?.data?.detail || "No se pudo registrar el ingreso de rollos.");
    }
  };

  const handleSaveNewRolloCode = async (e) => {
    e.preventDefault();
    if (!newRolloCodeForm.codigo.trim()) {
      showToast('warning', "Debe ingresar el código del alambre.");
      return;
    }
    if (!newRolloCodeForm.nombre.trim()) {
      showToast('warning', "Debe ingresar el tipo o descripción del rollo de alambre.");
      return;
    }

    try {
      await api.post('/logistica/tipos-alambre/', {
        codigo: newRolloCodeForm.codigo.trim().toUpperCase(),
        nombre: newRolloCodeForm.nombre.trim(),
        peso_estandar_kg: parseFloat(newRolloCodeForm.peso_estandar_kg) || 50.00
      });

      showToast('success', `Código [${newRolloCodeForm.codigo.toUpperCase()}] "${newRolloCodeForm.nombre}" registrado exitosamente en el catálogo.`);
      setIsNewRolloModalOpen(false);
      await fetchTiposAlambre();
    } catch (err) {
      console.error("Error al registrar código de alambre:", err);
      const errorMsg = err.response?.data?.codigo?.[0] || err.response?.data?.detail || "No se pudo registrar el nuevo código de alambre.";
      showToast('error', errorMsg);
    }
  };

  const handleDeleteRollo = (idRollo, codigoRollo) => {
    setConfirmDialog({
      title: "Eliminar Rollo de Alambre",
      message: `¿Está seguro de eliminar el rollo "${codigoRollo}" del inventario?`,
      confirmText: "Eliminar Rollo",
      confirmColor: "var(--danger)",
      onConfirm: async () => {
        try {
          await api.delete(`/logistica/rollos/${idRollo}/`);
          showToast('success', `Rollo "${codigoRollo}" eliminado del inventario.`);
          await fetchRollos();
          await fetchRollosMetricas();
          await fetchRollosDisponibles();
        } catch (err) {
          console.error("Error al eliminar rollo:", err);
          showToast('error', "No se pudo eliminar el rollo.");
        }
      }
    });
  };

  // --- MANEJO DE CLIENTES ---
  const handleOpenNewClienteModal = () => {
    setEditingClienteId(null);
    setClienteForm({ numero_cliente: '', nombre: '', direccion: '' });
    setIsNewClienteModalOpen(true);
  };

  const handleEditCliente = (c) => {
    setEditingClienteId(c.id_cliente);
    setClienteForm({
      numero_cliente: c.numero_cliente,
      nombre: c.nombre,
      direccion: c.direccion || ''
    });
    setIsNewClienteModalOpen(true);
  };

  const handleSaveCliente = async (e) => {
    e.preventDefault();
    if (!clienteForm.numero_cliente.trim() || !clienteForm.nombre.trim()) {
      showToast('warning', "El número y nombre de cliente son obligatorios.");
      return;
    }
    try {
      if (editingClienteId) {
        await api.put(`/logistica/clientes/${editingClienteId}/`, clienteForm);
        showToast('success', "Cliente actualizado correctamente.");
      } else {
        await api.post('/logistica/clientes/', clienteForm);
        showToast('success', "Cliente registrado correctamente.");
      }
      setIsNewClienteModalOpen(false);
      await fetchClientes();
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      showToast('error', "No se pudo guardar el registro del cliente. Asegúrese de que el número sea único.");
    }
  };

  const handleDeleteCliente = (id) => {
    setConfirmDialog({
      title: "Eliminar Cliente",
      message: "¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer.",
      confirmText: "Eliminar Cliente",
      confirmColor: "var(--danger)",
      onConfirm: async () => {
        try {
          await api.delete(`/logistica/clientes/${id}/`);
          showToast('success', "Cliente eliminado correctamente.");
          await fetchClientes();
        } catch (err) {
          console.error("Error al eliminar cliente:", err);
          showToast('error', "No se pudo eliminar el cliente.");
        }
      }
    });
  };

  // --- MANEJO DE CONDUCTORES ---
  const handleOpenNewConductorModal = () => {
    setEditingConductorId(null);
    setConductorForm({ codigo_carnet: '', nombre: '', fecha_vencimiento_licencia: '' });
    setIsNewConductorModalOpen(true);
  };

  const handleEditConductor = (cond) => {
    setEditingConductorId(cond.id_conductor);
    setConductorForm({
      codigo_carnet: cond.codigo_carnet || '',
      nombre: cond.nombre || '',
      fecha_vencimiento_licencia: cond.fecha_vencimiento_licencia || ''
    });
    setIsNewConductorModalOpen(true);
  };

  const handleSaveConductor = async (e) => {
    e.preventDefault();
    if (!conductorForm.nombre.trim()) {
      showToast('warning', "El nombre del conductor es obligatorio.");
      return;
    }

    const carnetTrim = conductorForm.codigo_carnet?.trim();
    if (carnetTrim) {
      if (!/^\d{6}$/.test(carnetTrim)) {
        showToast('warning', "El código de carnet debe contener exactamente 6 dígitos numéricos.");
        return;
      }
      const yaExiste = conductores.some(c => 
        String(c.codigo_carnet).trim() === carnetTrim && 
        String(c.id_conductor) !== String(editingConductorId)
      );
      if (yaExiste) {
        showToast('warning', "Este código de carnet ya se encuentra registrado para otro conductor.");
        return;
      }
    }

    try {
      const payload = {
        ...conductorForm,
        codigo_carnet: carnetTrim || null
      };
      if (editingConductorId) {
        await api.put(`/logistica/conductores/${editingConductorId}/`, payload);
        showToast('success', "Conductor actualizado correctamente.");
      } else {
        await api.post('/logistica/conductores/', payload);
        showToast('success', "Conductor registrado correctamente.");
      }
      setIsNewConductorModalOpen(false);
      setConductorForm({ codigo_carnet: '', nombre: '', fecha_vencimiento_licencia: '' });
      setEditingConductorId(null);
      await fetchConductores();
    } catch (err) {
      console.error("Error al guardar conductor:", err);
      const errMsg = err.response?.data?.codigo_carnet?.[0] ||
                     err.response?.data?.detail ||
                     "No se pudo guardar el registro del conductor.";
      showToast('error', errMsg);
    }
  };

  // --- MANEJO DE VEHÍCULOS (CAMIONES) ---
  const handleOpenNewVehiculoModal = () => {
    setEditingVehiculoId(null);
    setVehiculoForm({ unidad: '', placa: '', activo: true });
    setIsNewVehiculoModalOpen(true);
  };

  const handleEditVehiculo = (veh) => {
    setEditingVehiculoId(veh.id_vehiculo);
    setVehiculoForm({
      unidad: veh.unidad || veh.modelo || '',
      placa: veh.placa || '',
      activo: veh.activo !== undefined ? veh.activo : true
    });
    setIsNewVehiculoModalOpen(true);
  };

  const handleSaveVehiculo = async (e) => {
    e.preventDefault();
    if (!vehiculoForm.unidad.trim() || !vehiculoForm.placa.trim()) {
      showToast('warning', "La unidad y la placa del vehículo son obligatorias.");
      return;
    }
    try {
      if (editingVehiculoId) {
        await api.put(`/logistica/vehiculos/${editingVehiculoId}/`, vehiculoForm);
        showToast('success', "Vehículo actualizado correctamente.");
      } else {
        await api.post('/logistica/vehiculos/', vehiculoForm);
        showToast('success', "Vehículo registrado correctamente.");
      }
      setIsNewVehiculoModalOpen(false);
      setVehiculoForm({ unidad: '', placa: '', activo: true });
      setEditingVehiculoId(null);
      await fetchVehiculos();
    } catch (err) {
      console.error("Error al guardar vehículo:", err);
      showToast('error', "No se pudo guardar el vehículo. Verifique que la placa no esté duplicada.");
    }
  };

  const handleDeleteVehiculo = (id) => {
    setConfirmDialog({
      title: "Eliminar Vehículo",
      message: "¿Está seguro de eliminar este vehículo? Podría estar asignado a viajes u órdenes de trabajo.",
      confirmText: "Eliminar Vehículo",
      confirmColor: "var(--danger)",
      onConfirm: async () => {
        try {
          await api.delete(`/logistica/vehiculos/${id}/`);
          showToast('success', "Vehículo eliminado correctamente.");
          await fetchVehiculos();
        } catch (err) {
          console.error("Error al eliminar vehículo:", err);
          showToast('error', "No se pudo eliminar el vehículo. Podría estar asignado a viajes u órdenes de trabajo.");
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado Principal y Acciones */}
      <HeaderLogistica
        activeSubTab={activeSubTab}
        selectedViajeId={selectedViajeId}
        loading={loading}
        onOpenViajeDetail={handleOpenSelectedViajeDetail}
        onOpenNewViaje={handleOpenNewViajeModal}
        onOpenNewCliente={handleOpenNewClienteModal}
        onOpenNewConductor={handleOpenNewConductorModal}
        onOpenNewVehiculo={handleOpenNewVehiculoModal}
        onOpenIngresoRollo={handleOpenIngresoRolloModal}
        onOpenNewRollo={handleOpenNewRolloModal}
        onReload={loadTabData}
      />

      {/* PESTAÑA 1: GESTIÓN DE VIAJES */}
      {activeSubTab === 'viajes' && (
        <TabViajes
          progDesde={progDesde}
          setProgDesde={setProgDesde}
          hasta={hasta}
          setHasta={setHasta}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
          viajes={viajes}
          selectedViajeId={selectedViajeId}
          setSelectedViajeId={setSelectedViajeId}
        />
      )}

      {/* PESTAÑA 2: CATÁLOGO DE CLIENTES */}
      {activeSubTab === 'clientes' && (
        <TabClientes
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
          clientes={clientes}
          onEditCliente={handleEditCliente}
          onDeleteCliente={handleDeleteCliente}
        />
      )}

      {/* PESTAÑA 3: CONDUCTORES / PILOTOS */}
      {activeSubTab === 'conductores' && (
        <TabConductores
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
          conductores={conductores}
          onEditConductor={handleEditConductor}
        />
      )}

      {/* PESTAÑA 4: VEHÍCULOS / CAMIONES */}
      {activeSubTab === 'vehiculos' && (
        <TabVehiculos
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
          vehiculos={vehiculos}
          onEditVehiculo={handleEditVehiculo}
          onDeleteVehiculo={handleDeleteVehiculo}
        />
      )}

      {/* PESTAÑA 5: CONTROL DE ROLLOS DE ALAMBRE */}
      {activeSubTab === 'rollos' && (
        <TabRollos
          rolloFilterEstado={rolloFilterEstado}
          setRolloFilterEstado={setRolloFilterEstado}
          rolloSearch={rolloSearch}
          setRolloSearch={setRolloSearch}
          loading={loading}
          rollos={rollos}
          onDeleteRollo={handleDeleteRollo}
        />
      )}

      {/* MODAL DETALLE DE VIAJE */}
      <ModalDetalleViaje
        isOpen={Boolean(selectedViajeDetail)}
        onClose={() => setSelectedViajeDetail(null)}
        viaje={selectedViajeDetail}
        onCompletarEntrega={(id) => handleUpdateStatusViaje(id, 'Cerrada')}
        setConfirmDialog={setConfirmDialog}
      />

      {/* MODAL 1: PROGRAMAR NUEVO VIAJE */}
      <ModalProgramarViaje
        isOpen={isNewViajeModalOpen}
        onClose={() => setIsNewViajeModalOpen(false)}
        viajeForm={viajeForm}
        setViajeForm={setViajeForm}
        vehiculos={vehiculos}
        clientes={clientes}
        conductores={conductores}
        rollosDisponibles={rollosDisponibles}
        selectedRollosIds={selectedRollosIds}
        onToggleRolloSelection={handleToggleRolloSelection}
        onSubmit={handleSaveViaje}
      />

      {/* MODAL 2: CREAR / EDITAR CLIENTE */}
      <ModalCliente
        isOpen={isNewClienteModalOpen}
        onClose={() => setIsNewClienteModalOpen(false)}
        clienteForm={clienteForm}
        setClienteForm={setClienteForm}
        editingClienteId={editingClienteId}
        onSubmit={handleSaveCliente}
      />

      {/* MODAL 3: CREAR / EDITAR CONDUCTOR */}
      <ModalConductor
        isOpen={isNewConductorModalOpen}
        onClose={() => setIsNewConductorModalOpen(false)}
        conductorForm={conductorForm}
        setConductorForm={setConductorForm}
        editingConductorId={editingConductorId}
        onSubmit={handleSaveConductor}
      />

      {/* MODAL 4: CREAR / EDITAR VEHÍCULO */}
      <ModalVehiculo
        isOpen={isNewVehiculoModalOpen}
        onClose={() => setIsNewVehiculoModalOpen(false)}
        vehiculoForm={vehiculoForm}
        setVehiculoForm={setVehiculoForm}
        editingVehiculoId={editingVehiculoId}
        onSubmit={handleSaveVehiculo}
      />

      {/* MODAL 5: REGISTRAR NUEVO CÓDIGO DE ALAMBRE */}
      <ModalNuevoCodigoRollo
        isOpen={isNewRolloModalOpen}
        onClose={() => setIsNewRolloModalOpen(false)}
        newRolloCodeForm={newRolloCodeForm}
        setNewRolloCodeForm={setNewRolloCodeForm}
        onSubmit={handleSaveNewRolloCode}
      />

      {/* MODAL 6: INGRESO DE ROLLOS CON CÓDIGO EXISTENTE */}
      <ModalIngresoRollos
        isOpen={isIngresoRolloModalOpen}
        onClose={() => setIsIngresoRolloModalOpen(false)}
        ingresoRolloForm={ingresoRolloForm}
        setIngresoRolloForm={setIngresoRolloForm}
        tiposAlambre={tiposAlambre}
        onSubmit={handleSaveIngresoRolloExistente}
      />

      {/* DIÁLOGO CONFIRMACIÓN GENERAL DEL SISTEMA */}
      <ConfirmDialog dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} />

      {/* NOTIFICACIÓN TOAST DEL SISTEMA */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

    </div>
  );
};

export default LogisticaModule;
