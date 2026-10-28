import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { logisticaService } from '@/services/logisticaService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import CustomSelect from '@/components/common/CustomSelect';
import {
  Navigation,
  PlusCircle,
  Search,
  RefreshCw,
  Eye,
  X,
  ShieldAlert,
  Users,
  Building,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  Trash2,
  Edit,
  Save,
  PackageCheck,
  Layers,
  Boxes,
  CheckSquare,
  Square,
  AlertCircle,
  Download
} from 'lucide-react';

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
    try {
      if (editingConductorId) {
        await api.put(`/logistica/conductores/${editingConductorId}/`, conductorForm);
        showToast('success', "Conductor actualizado correctamente.");
      } else {
        await api.post('/logistica/conductores/', conductorForm);
        showToast('success', "Conductor registrado correctamente.");
      }
      setIsNewConductorModalOpen(false);
      setConductorForm({ codigo_carnet: '', nombre: '', fecha_vencimiento_licencia: '' });
      setEditingConductorId(null);
      await fetchConductores();
    } catch (err) {
      console.error("Error al guardar conductor:", err);
      showToast('error', "No se pudo guardar el registro del conductor.");
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
      
      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Navigation size={28} style={{ color: 'var(--blue)' }} />
            Módulo de Logística y Control de Viajes
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Consulta de Viajes, Programación de Cargas y Catálogo de Clientes y Conductores
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeSubTab === 'viajes' && (
            <>
              <button
                className="btn-secondary"
                onClick={handleOpenSelectedViajeDetail}
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
                onClick={handleOpenNewViajeModal}
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
              onClick={handleOpenNewClienteModal}
              style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={18} />
              Nuevo Cliente
            </button>
          )}

          {activeSubTab === 'conductores' && (
            <button
              className="btn-primary"
              onClick={handleOpenNewConductorModal}
              style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={18} />
              Nuevo Conductor
            </button>
          )}

          {activeSubTab === 'vehiculos' && (
            <button
              className="btn-primary"
              onClick={handleOpenNewVehiculoModal}
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
                onClick={handleOpenIngresoRolloModal}
                style={{ width: 'auto', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--blue)' }}
                title="Ingresar rollos a bodega seleccionando un código de alambre pre-registrado existente"
              >
                <Download size={18} />
                Ingreso de Rollos
              </button>
              <button
                className="btn-action"
                onClick={handleOpenNewRolloModal}
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
            onClick={loadTabData}
            title="Recargar Datos"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE VIAJES */}
      {activeSubTab === 'viajes' && (
        <>
          {/* Barra Superior de Filtros por Rango de Fechas */}
          <div className="card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem' }}>Prog desde:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '150px', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                  value={progDesde}
                  onChange={(e) => setProgDesde(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem' }}>Hasta:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '150px', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </div>

              {(progDesde || hasta) && (
                <button
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                  onClick={() => { setProgDesde(''); setHasta(''); }}
                >
                  Limpiar Fechas
                </button>
              )}
            </div>

            <div className="input-container" style={{ width: '280px' }}>
              <Search className="input-icon" size={15} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por N° viaje, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla Estructurada de Viajes */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ width: '40px', textAlign: 'center', padding: '0.75rem' }}>✓</th>
                    <th style={{ padding: '0.75rem' }}>N° Viaje</th>
                    <th style={{ padding: '0.75rem' }}>Unidad</th>
                    <th style={{ padding: '0.75rem' }}>Conductor</th>
                    <th style={{ padding: '0.75rem' }}>N° de Cliente</th>
                    <th style={{ padding: '0.75rem' }}>Nombre del Cliente</th>
                    <th style={{ padding: '0.75rem' }}>Dirección Destino</th>
                    <th style={{ padding: '0.75rem' }}>Fecha Programada</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Cargando consulta de viajes...
                      </td>
                    </tr>
                  ) : viajes.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No se encontraron registros de viajes en el rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    viajes.map((v) => {
                      const isSelected = selectedViajeId === v.id_viaje;
                      return (
                        <tr
                          key={v.id_viaje}
                          style={{
                            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)'
                          }}
                          onClick={() => setSelectedViajeId(isSelected ? null : v.id_viaje)}
                        >
                          <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setSelectedViajeId(isSelected ? null : v.id_viaje)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                            #{v.numero_viaje}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                            {v.vehiculo_detail ? `${v.vehiculo_detail.placa} (${v.vehiculo_detail.unidad || v.vehiculo_detail.modelo || 'Unidad'})` : 'Sin unidad'}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                            {v.conductor_detail ? v.conductor_detail.nombre : <span style={{ color: 'var(--text-muted)' }}>Sin conductor</span>}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                            {v.cliente_detail?.numero_cliente || 'N/A'}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                            {v.cliente_detail?.nombre || 'Cliente sin nombre'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem', padding: '0.75rem' }}>
                            {v.cliente_detail?.direccion || '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                            {v.fecha_envio ? new Date(v.fecha_envio + 'T00:00:00').toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* PESTAÑA 2: CATÁLOGO DE CLIENTES */}
      {activeSubTab === 'clientes' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>Catálogo General de Clientes</h3>
            <div className="input-container" style={{ width: '320px' }}>
              <Search className="input-icon" size={15} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por número o nombre de cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem' }}>Número de Cliente</th>
                  <th style={{ padding: '0.75rem' }}>Nombre / Empresa</th>
                  <th style={{ padding: '0.75rem' }}>Dirección Pre-establecida</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Cargando catálogo de clientes...
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay clientes registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id_cliente} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                        {c.numero_cliente}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                        {c.nombre}
                      </td>
                      <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                        {c.direccion || 'Sin dirección registrada'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem' }}
                            onClick={() => handleEditCliente(c)}
                            title="Editar Cliente"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                            onClick={() => handleDeleteCliente(c.id_cliente)}
                            title="Eliminar Cliente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CONDUCTORES / PILOTOS */}
      {activeSubTab === 'conductores' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>Lista de Conductores y Caducidad de Licencias</h3>
            <div className="input-container" style={{ width: '360px' }}>
              <Search className="input-icon" size={15} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar conductor por nombre o código de carnet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>Código de Carnet</th>
                  <th style={{ padding: '0.75rem' }}>Nombre Completo del Conductor</th>
                  <th style={{ padding: '0.75rem' }}>Caducidad del Número de Licencia</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Cargando lista de conductores...
                    </td>
                  </tr>
                ) : conductores.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay conductores registrados.
                    </td>
                  </tr>
                ) : (
                  conductores.map((cond) => (
                    <tr key={cond.id_conductor} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>#{cond.id_conductor}</td>
                      <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                        {cond.codigo_carnet || '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>{cond.nombre}</td>
                      <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                        {cond.fecha_vencimiento_licencia ? new Date(cond.fecha_vencimiento_licencia + 'T00:00:00').toLocaleDateString() : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <button
                          className="btn-primary"
                          style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={() => handleEditConductor(cond)}
                        >
                          <Edit size={13} /> Editar
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

      {/* PESTAÑA 4: VEHÍCULOS / CAMIONES */}
      {activeSubTab === 'vehiculos' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>Catálogo de Vehículos (Camiones)</h3>
            <div className="input-container" style={{ width: '320px' }}>
              <Search className="input-icon" size={15} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por unidad o placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>Unidad</th>
                  <th style={{ padding: '0.75rem' }}>Placa</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Cargando catálogo de vehículos...
                    </td>
                  </tr>
                ) : vehiculos.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay vehículos registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  vehiculos.map((v) => (
                    <tr key={v.id_vehiculo} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>#{v.id_vehiculo}</td>
                      <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                        {v.unidad || v.modelo || 'Sin unidad especificada'}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                        {v.placa}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {v.activo !== false ? (
                          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                            Activo
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem' }}
                            onClick={() => handleEditVehiculo(v)}
                            title="Editar Vehículo"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                            onClick={() => handleDeleteVehiculo(v.id_vehiculo)}
                            title="Eliminar Vehículo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 5: CONTROL DE ROLLOS DE ALAMBRE */}
      {activeSubTab === 'rollos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Tabla de Inventario de Rollos */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
                  Inventario y Trazabilidad de Rollos de Alambre
                </h3>
                {/* Selector de filtro por estado */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['Todos', 'Disponible', 'En Viaje', 'Entregado'].map((est) => (
                    <button
                      key={est}
                      onClick={() => setRolloFilterEstado(est)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '14px',
                        border: rolloFilterEstado === est ? '1px solid #bfdbfe' : '1px solid var(--border)',
                        backgroundColor: rolloFilterEstado === est ? '#1e40af' : 'transparent',
                        color: rolloFilterEstado === est ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="input-container" style={{ width: '280px' }}>
                  <Search className="input-icon" size={15} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar por código o tipo..."
                    value={rolloSearch}
                    onChange={(e) => setRolloSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem' }}>Código Rollo</th>
                    <th style={{ padding: '0.75rem' }}>Tipo de Alambre</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Peso (kg)</th>
                    <th style={{ padding: '0.75rem' }}>Ubicación en Bodega</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '0.75rem' }}>Viaje Asignado / Destino</th>
                    <th style={{ padding: '0.75rem' }}>Fecha de Ingreso</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Cargando inventario de rollos...
                      </td>
                    </tr>
                  ) : rollos.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <Boxes size={32} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                          <span>No se encontraron rollos de alambre en este criterio de búsqueda.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rollos.map((r) => {
                      let badgeStyle = { backgroundColor: '#dcfce7', color: '#15803d' };
                      if (r.estado === 'En Viaje') badgeStyle = { backgroundColor: '#fef3c7', color: '#b45309' };
                      else if (r.estado === 'Entregado') badgeStyle = { backgroundColor: '#dbeafe', color: '#1e40af' };

                      return (
                        <tr key={r.id_rollo} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ fontWeight: 700, color: 'var(--yellow)', padding: '0.75rem' }}>
                            {r.codigo_rollo}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--white)', padding: '0.75rem' }}>
                            {r.tipo_alambre}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--white)', padding: '0.75rem' }}>
                            {Number(r.peso_kg || 0).toFixed(2)} kg
                          </td>
                          <td style={{ color: 'var(--text-muted)', padding: '0.75rem' }}>
                            {r.ubicacion || 'Bodega Central'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                            <span style={{ ...badgeStyle, padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                              {r.estado}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {r.viaje_numero ? (
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--blue)' }}>Viaje #{r.viaje_numero}</span>
                                {r.cliente_nombre && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Cliente: {r.cliente_nombre}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                En Bodega (Sin Asignar)
                              </span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)', padding: '0.75rem', fontSize: '0.82rem' }}>
                            {r.fecha_ingreso ? new Date(r.fecha_ingreso).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                            {r.estado === 'Disponible' ? (
                              <button
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                                onClick={() => handleDeleteRollo(r.id_rollo, r.codigo_rollo)}
                                title="Eliminar Rollo del Inventario"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Bloqueado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MÁS INFORMACIÓN DEL VIAJE (EXTRACTO STRICT DE 6 CAMPOS) */}
      {selectedViajeDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} style={{ color: 'var(--blue)' }} />
                Detalle del Viaje #{selectedViajeDetail.numero_viaje}
              </h2>
              <button
                onClick={() => setSelectedViajeDetail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>1. Fecha del Envío</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
                  {selectedViajeDetail.fecha_envio ? new Date(selectedViajeDetail.fecha_envio + 'T00:00:00').toLocaleDateString() : '—'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>2. Hora del Envío</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
                  {selectedViajeDetail.hora_envio || '—'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>3. Unidad</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--yellow)' }}>
                  {selectedViajeDetail.vehiculo_detail ? `${selectedViajeDetail.vehiculo_detail.placa} (${selectedViajeDetail.vehiculo_detail.unidad || selectedViajeDetail.vehiculo_detail.modelo || 'Unidad'})` : 'Sin unidad'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>4. Conductor Asignado</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--white)' }}>
                  {selectedViajeDetail.conductor_detail ? selectedViajeDetail.conductor_detail.nombre : 'Sin conductor asignado'}
                </strong>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Cliente y Dirección de Destino:
              </span>
              <div style={{ fontSize: '0.92rem', color: 'var(--white)', fontWeight: 700, marginBottom: '0.25rem' }}>
                {selectedViajeDetail.cliente_detail?.numero_cliente || 'N/A'} - {selectedViajeDetail.cliente_detail?.nombre || ''}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {selectedViajeDetail.cliente_detail?.direccion || 'Sin dirección registrada.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>5. Peso de la Carga</span>
                <strong style={{ fontSize: '1rem', color: 'var(--white)' }}>
                  {Number(selectedViajeDetail.peso_carga_kg || 0).toLocaleString()} kg
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>6. Volumen (Rollos Asignados)</span>
                <strong style={{ fontSize: '1rem', color: 'var(--blue)' }}>
                  {selectedViajeDetail.cantidad_rollos || (selectedViajeDetail.rollos_detail ? selectedViajeDetail.rollos_detail.length : 0)} rollos
                </strong>
              </div>
            </div>

            {/* Listado de Rollos Asignados */}
            <div style={{ marginTop: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '0.65rem 0.9rem', backgroundColor: 'var(--bg-element)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={15} style={{ color: 'var(--yellow)' }} />
                  Rollos Asignados a la Carga ({selectedViajeDetail.rollos_detail?.length || 0})
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  backgroundColor: selectedViajeDetail.estado === 'Cerrada' ? '#dcfce7' : '#fef3c7',
                  color: selectedViajeDetail.estado === 'Cerrada' ? '#15803d' : '#b45309'
                }}>
                  {selectedViajeDetail.estado === 'Cerrada' ? 'Viaje Entregado y Cerrado' : `Estado: ${selectedViajeDetail.estado || 'Abierta'}`}
                </span>
              </div>

              <div style={{ maxHeight: '170px', overflowY: 'auto' }}>
                {(!selectedViajeDetail.rollos_detail || selectedViajeDetail.rollos_detail.length === 0) ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No hay rollos físicos individuales vinculados a este viaje.
                  </div>
                ) : (
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.45rem 0.75rem' }}>Código Rollo</th>
                        <th style={{ padding: '0.45rem 0.75rem' }}>Tipo de Alambre</th>
                        <th style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>Peso</th>
                        <th style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>Estado Rollo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedViajeDetail.rollos_detail.map((rd) => (
                        <tr key={rd.id_rollo} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.45rem 0.75rem', fontWeight: 700, color: 'var(--yellow)' }}>
                            {rd.codigo_rollo}
                          </td>
                          <td style={{ padding: '0.45rem 0.75rem', color: 'var(--white)' }}>
                            {rd.tipo_alambre}
                          </td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--white)' }}>
                            {rd.peso_kg} kg
                          </td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '10px',
                              backgroundColor: rd.estado === 'Entregado' ? '#dcfce7' : '#fef3c7',
                              color: rd.estado === 'Entregado' ? '#15803d' : '#b45309',
                              fontWeight: 700
                            }}>
                              {rd.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                {selectedViajeDetail.estado !== 'Cerrada' && (
                  <button
                    className="btn-primary"
                    style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                    onClick={() => {
                      setConfirmDialog({
                        title: "Completar Entrega",
                        message: "¿Desea marcar este viaje como ENTREGADO y CERRADO? Los rollos asignados se actualizarán a estado 'Entregado'.",
                        confirmText: "Completar Entrega",
                        confirmColor: "#16a34a",
                        onConfirm: async () => {
                          await handleUpdateStatusViaje(selectedViajeDetail.id_viaje, 'Cerrada');
                        }
                      });
                    }}
                  >
                    <CheckCircle2 size={15} /> Completar Entrega (Cerrar Viaje)
                  </button>
                )}
              </div>

              <button
                className="btn-secondary"
                onClick={() => setSelectedViajeDetail(null)}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: PROGRAMAR NUEVO VIAJE */}
      {isNewViajeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} style={{ color: 'var(--blue)' }} />
                Programar Nuevo Viaje
              </h2>
              <button
                onClick={() => setIsNewViajeModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveViaje}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Número de Viaje *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={viajeForm.numero_viaje}
                    readOnly
                    title="Correlativo asignado automáticamente"
                    style={{ fontWeight: 700, color: 'var(--yellow)', paddingLeft: '0.6rem', cursor: 'default' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Correlativo generado automáticamente</span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Unidad *</label>
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Seleccionar Unidad --' },
                      ...vehiculos.map(v => ({
                        value: v.id_vehiculo,
                        label: v.activo !== false
                          ? `${v.placa} (${v.unidad || v.modelo || 'Unidad'}) - Activo`
                          : `${v.placa} (${v.unidad || v.modelo || 'Unidad'}) - ⛔ Inactivo (No disponible)`
                      }))
                    ]}
                    value={viajeForm.vehiculo}
                    onChange={(e) => setViajeForm({ ...viajeForm, vehiculo: e.target.value })}
                    placeholder="-- Seleccionar Unidad --"
                    required
                    maxHeight={180}
                  />
                  {(() => {
                    const selVeh = vehiculos.find(v => String(v.id_vehiculo) === String(viajeForm.vehiculo));
                    if (selVeh && selVeh.activo === false) {
                      return (
                        <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', fontWeight: 600 }}>
                          ⚠️ Esta unidad está inactiva y no se puede generar el viaje con ella.
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <CustomSelect
                  options={[
                    { value: '', label: '-- Seleccionar Cliente --' },
                    ...clientes.map(c => ({
                      value: c.id_cliente,
                      label: `${c.numero_cliente} - ${c.nombre}`
                    }))
                  ]}
                  value={viajeForm.cliente}
                  onChange={(e) => setViajeForm({ ...viajeForm, cliente: e.target.value })}
                  placeholder="-- Seleccionar Cliente --"
                  required
                  maxHeight={200}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Conductor Asignado *</label>
                <CustomSelect
                  options={[
                    { value: '', label: '-- Seleccionar Conductor --' },
                    ...conductores.map(c => ({
                      value: c.id_conductor,
                      label: `${c.nombre}${c.codigo_carnet ? ` - Carnet: ${c.codigo_carnet}` : ''}`
                    }))
                  ]}
                  value={viajeForm.conductor}
                  onChange={(e) => setViajeForm({ ...viajeForm, conductor: e.target.value })}
                  placeholder="-- Seleccionar Conductor --"
                  required
                  maxHeight={180}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Fecha del Envío *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={viajeForm.fecha_envio}
                    onChange={(e) => setViajeForm({ ...viajeForm, fecha_envio: e.target.value })}
                    required
                    style={{ paddingLeft: '0.6rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hora del Envío</label>
                  <input
                    type="time"
                    className="form-input"
                    value={viajeForm.hora_envio}
                    onChange={(e) => setViajeForm({ ...viajeForm, hora_envio: e.target.value })}
                    style={{ paddingLeft: '0.6rem' }}
                  />
                </div>
              </div>

              {/* Asignación interactiva de Rollos de Alambre */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--bg-element)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={16} style={{ color: 'var(--yellow)' }} />
                    Asignación de Rollos de Alambre ({selectedRollosIds.length} seleccionados)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, backgroundColor: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    {rollosDisponibles.length} disponibles en bodega
                  </span>
                </div>

                {/* Lista seleccionable de rollos disponibles para selección libre */}
                {rollosDisponibles.length === 0 ? (
                  <div style={{ padding: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px dashed #ef4444', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', color: '#f87171' }}>
                    <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                    No hay rollos disponibles en bodega. Puede registrar nuevos lotes en la pestaña <strong>Control de Rollos</strong>.
                  </div>
                ) : (
                  <div style={{ maxHeight: '185px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--bg-base)' }}>
                    {rollosDisponibles.map((r) => {
                      const isSelected = selectedRollosIds.includes(r.id_rollo);
                      return (
                        <div
                          key={r.id_rollo}
                          onClick={() => handleToggleRolloSelection(r)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.35rem 0.65rem',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                            transition: 'background-color 0.1s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                            {isSelected ? (
                              <CheckSquare size={16} style={{ color: 'var(--blue)' }} />
                            ) : (
                              <Square size={16} style={{ color: 'var(--text-muted)' }} />
                            )}
                            <span style={{ fontWeight: 700, color: isSelected ? 'var(--blue)' : 'var(--yellow)', fontSize: '0.82rem' }}>
                              {r.codigo_rollo}
                            </span>
                            <span style={{ color: 'var(--white)', fontSize: '0.78rem' }}>
                              {r.tipo_alambre}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{r.ubicacion || 'Bodega'}</span>
                            <strong style={{ color: 'var(--white)' }}>{Number(r.peso_kg || 0).toFixed(1)} kg</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Resumen calculado automático */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', margin: '0 0 0.2rem 0' }}>Rollos Asignados</label>
                    <input
                      type="number"
                      className="form-input"
                      value={viajeForm.cantidad_rollos}
                      readOnly
                      style={{ fontWeight: 700, color: 'var(--blue)', paddingLeft: '0.6rem', backgroundColor: 'var(--bg-base)', cursor: 'default' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', margin: '0 0 0.2rem 0' }}>Peso Total Carga (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={viajeForm.peso_carga_kg}
                      onChange={(e) => setViajeForm({ ...viajeForm, peso_carga_kg: parseFloat(e.target.value) || 0 })}
                      style={{ fontWeight: 700, color: 'var(--white)', paddingLeft: '0.6rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsNewViajeModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Guardar Viaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR / EDITAR CLIENTE */}
      {isNewClienteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={20} style={{ color: 'var(--blue)' }} />
                {editingClienteId ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setIsNewClienteModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCliente}>
              <div className="form-group">
                <label className="form-label">Número / Código de Cliente *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 0000607020"
                  style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
                  value={clienteForm.numero_cliente}
                  onChange={(e) => setClienteForm({ ...clienteForm, numero_cliente: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Cliente / Empresa *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. GRUPO VITAL VITALSA TICSA"
                  style={{ paddingLeft: '0.6rem' }}
                  value={clienteForm.nombre}
                  onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección Pre-establecida</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Ej. Km 14.5 Carretera a Mixco, Zona 4 de Mixco, Guatemala"
                  style={{ padding: '0.6rem', resize: 'vertical' }}
                  value={clienteForm.direccion}
                  onChange={(e) => setClienteForm({ ...clienteForm, direccion: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsNewClienteModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingClienteId ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREAR / EDITAR CONDUCTOR */}
      {isNewConductorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} style={{ color: 'var(--blue)' }} />
                {editingConductorId ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}
              </h2>
              <button
                onClick={() => setIsNewConductorModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConductor}>
              <div className="form-group">
                <label className="form-label">Código de Carnet (Números)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 0000701010"
                  style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
                  value={conductorForm.codigo_carnet}
                  onChange={(e) => setConductorForm({ ...conductorForm, codigo_carnet: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre Completo del Conductor *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Roberto Estrada"
                  style={{ paddingLeft: '0.6rem' }}
                  value={conductorForm.nombre}
                  onChange={(e) => setConductorForm({ ...conductorForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Caducidad del Número de Licencia</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ paddingLeft: '0.6rem' }}
                  value={conductorForm.fecha_vencimiento_licencia}
                  onChange={(e) => setConductorForm({ ...conductorForm, fecha_vencimiento_licencia: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsNewConductorModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingConductorId ? 'Guardar Cambios' : 'Guardar Conductor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREAR / EDITAR VEHÍCULO (CAMIÓN) */}
      {isNewVehiculoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} style={{ color: 'var(--blue)' }} />
                {editingVehiculoId ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
              </h2>
              <button
                onClick={() => setIsNewVehiculoModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVehiculo}>
              <div className="form-group">
                <label className="form-label">Unidad *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Kenworth T680 2022 o Camión 01"
                  style={{ paddingLeft: '0.6rem' }}
                  value={vehiculoForm.unidad}
                  onChange={(e) => setVehiculoForm({ ...vehiculoForm, unidad: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Placa *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. C-44589"
                  style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
                  value={vehiculoForm.placa}
                  onChange={(e) => setVehiculoForm({ ...vehiculoForm, placa: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado de la Unidad</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.4rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--white)' }}>
                    <input
                      type="radio"
                      name="vehiculoActivo"
                      checked={vehiculoForm.activo === true}
                      onChange={() => setVehiculoForm({ ...vehiculoForm, activo: true })}
                    />
                    Activo
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--white)' }}>
                    <input
                      type="radio"
                      name="vehiculoActivo"
                      checked={vehiculoForm.activo === false}
                      onChange={() => setVehiculoForm({ ...vehiculoForm, activo: false })}
                    />
                    Inactivo
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsNewVehiculoModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingVehiculoId ? 'Guardar Cambios' : 'Guardar Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: REGISTRAR NUEVO CÓDIGO DE ALAMBRE */}
      {isNewRolloModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} style={{ color: 'var(--yellow)' }} />
                Registrar Código de Alambre
              </h2>
              <button
                onClick={() => setIsNewRolloModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewRolloCode}>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.8rem', color: '#93c5fd', lineHeight: 1.4 }}>
                ℹ️ Este formulario es <strong>exclusivo para crear nuevos códigos de alambre</strong> en el catálogo. Para dar ingreso de rollos físicos a bodega, utiliza el botón <strong>"Ingreso de Rollos"</strong>.
              </div>

              {/* 1. Código del Alambre */}
              <div className="form-group">
                <label className="form-label">Código del Alambre / Rollo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. AL-72150, AL-72156..."
                  value={newRolloCodeForm.codigo}
                  onChange={(e) => setNewRolloCodeForm({ ...newRolloCodeForm, codigo: e.target.value })}
                  required
                  style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Código identificador único para este tipo de alambre</span>
              </div>

              {/* 2. Tipo / Descripción del Rollo (Editable) */}
              <div className="form-group">
                <label className="form-label">Tipo / Descripción del Rollo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Alambre Galvanizado Calibre 10 de Alta Resistencia"
                  value={newRolloCodeForm.nombre}
                  onChange={(e) => setNewRolloCodeForm({ ...newRolloCodeForm, nombre: e.target.value })}
                  required
                  style={{ paddingLeft: '0.6rem', color: 'var(--white)' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Escribe la descripción o especificación del alambre</span>
              </div>

              {/* 3. Peso Estándar Unitario (kg) */}
              <div className="form-group">
                <label className="form-label">Peso Estándar por Rollo (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  className="form-input"
                  placeholder="50.0"
                  value={newRolloCodeForm.peso_estandar_kg}
                  onChange={(e) => setNewRolloCodeForm({ ...newRolloCodeForm, peso_estandar_kg: parseFloat(e.target.value) || 0 })}
                  required
                  style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--white)' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Peso promedio predeterminado en kilogramos</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsNewRolloModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <PlusCircle size={16} />
                  Crear Código
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: INGRESO DE ROLLOS CON CÓDIGO EXISTENTE */}
      {isIngresoRolloModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={20} style={{ color: 'var(--blue)' }} />
                Ingreso a Bodega de Rollos (Código Existente)
              </h2>
              <button
                onClick={() => setIsIngresoRolloModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIngresoRolloExistente}>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.8rem', color: '#93c5fd', lineHeight: 1.4 }}>
                ℹ️ Selecciona el <strong>código existente de alambre</strong> pre-registrado. Los datos técnicos (tipo de alambre y peso estándar) se cargan automáticamente sin necesidad de escribirlos a mano.
              </div>

              {/* Selector de Código Existente */}
              <div className="form-group">
                <label className="form-label">Código de Alambre Pre-Registrado *</label>
                <select
                  className="form-input"
                  value={ingresoRolloForm.codigo_alambre}
                  onChange={(e) => {
                    const selected = tiposAlambre.find(t => t.codigo === e.target.value);
                    setIngresoRolloForm({
                      ...ingresoRolloForm,
                      codigo_alambre: e.target.value,
                      ubicacion: selected?.ubicacion_defecto || ingresoRolloForm.ubicacion
                    });
                  }}
                  style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--yellow)' }}
                  required
                >
                  {tiposAlambre.map((t) => (
                    <option key={t.id_tipo || t.codigo} value={t.codigo}>
                      [{t.codigo}] {t.nombre}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Catálogo oficial de códigos pre-registrados</span>
              </div>

              {/* Datos técnicos autocompletados (Solo Lectura) */}
              {(() => {
                const selectedWire = tiposAlambre.find(t => t.codigo === ingresoRolloForm.codigo_alambre) || tiposAlambre[0];
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--bg-element)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                        Tipo de Alambre (Pre-registrado)
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--white)' }}>
                        {selectedWire?.nombre || '—'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                        Peso Estándar Unitario
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--yellow)' }}>
                        {Number(selectedWire?.peso_estandar_kg || 50).toFixed(2)} kg
                      </strong>
                    </div>
                  </div>
                );
              })()}

              {/* Cantidad y Ubicación */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Cantidad de Rollos a Ingresar *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    className="form-input"
                    value={ingresoRolloForm.cantidad}
                    onChange={(e) => setIngresoRolloForm({ ...ingresoRolloForm, cantidad: parseInt(e.target.value) || 1 })}
                    required
                    style={{ paddingLeft: '0.6rem', fontWeight: 700, color: 'var(--blue)' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rollos que ingresan a bodega</span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ubicación / Bahía en Bodega *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Bodega Central - Bahía A"
                    value={ingresoRolloForm.ubicacion}
                    onChange={(e) => setIngresoRolloForm({ ...ingresoRolloForm, ubicacion: e.target.value })}
                    required
                    style={{ paddingLeft: '0.6rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lugar de almacenamiento</span>
                </div>
              </div>

              {/* Resumen Calculado */}
              {(() => {
                const selectedWire = tiposAlambre.find(t => t.codigo === ingresoRolloForm.codigo_alambre) || tiposAlambre[0];
                const pesoUnit = parseFloat(selectedWire?.peso_estandar_kg || 50);
                const totalPeso = (ingresoRolloForm.cantidad || 0) * pesoUnit;
                return (
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-element)', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Peso Total del Ingreso:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--yellow)' }}>
                      {totalPeso.toLocaleString()} kg
                    </strong>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsIngresoRolloModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--blue)' }}
                >
                  <Download size={16} />
                  Registrar Ingreso a Bodega
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

export default LogisticaModule;
