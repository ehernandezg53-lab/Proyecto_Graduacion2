import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { usuariosService } from '@/services/usuariosService';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog, ToastNotification } from '@/components/common';
import { ModalUsuario, ModalAutorizarPin, ModalImprimirHoja } from './components';
import {
  Users, UserPlus, Search, CheckCircle2, XCircle, RefreshCw, X, Edit2, Trash2,
  KeyRound, Printer, Clock, ShieldCheck, AlertCircle, Check, FileText
} from 'lucide-react';

const DEFAULT_ROLES = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Bodeguero' },
  { id: 3, nombre: 'Taller' },
  { id: 4, nombre: 'Logística' },
];

export const UserManagement = ({ activeMainTab: externalActiveMainTab, setActiveMainTab: externalSetActiveMainTab }) => {
  // Pestaña principal: 'usuarios' o 'solicitudes'
  const [internalActiveMainTab, setInternalActiveMainTab] = useState('usuarios');
  const activeMainTab = externalActiveMainTab ?? internalActiveMainTab;
  const setActiveMainTab = externalSetActiveMainTab ?? setInternalActiveMainTab;

  // Estados para Usuarios
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);

  // Modal Crear/Editar Usuario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    username: '',
    telefono: '',
    rol: '',
    password: '',
  });

  // Diálogo de confirmación de toggle activo
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToConfirm, setUserToConfirm] = useState(null);

  // Estados para Solicitudes de Restablecimiento
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesLoading, setSolicitudesLoading] = useState(false);
  const [solicitudSearch, setSolicitudSearch] = useState('');
  const [solicitudEstadoFilter, setSolicitudEstadoFilter] = useState('Todos');

  // Modal para Autorizar PIN
  const [selectedSolicitudForAuth, setSelectedSolicitudForAuth] = useState(null);
  const [pinTemporalInput, setPinTemporalInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Modal para Imprimir Hoja de Autorización
  const [selectedSolicitudForPrint, setSelectedSolicitudForPrint] = useState(null);

  // Notificaciones y mensajes del propio sistema (sustituye alertas del navegador)
  const { toast, showToast } = useToast();

  const [authError, setAuthError] = useState('');
  const [userFormError, setUserFormError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRoles(res.data);
      }
    } catch (err) {
      console.error("Error al cargar roles:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { incluir_inactivos: includeInactive };
      if (search) params.search = search;
      if (selectedRole) params.rol = selectedRole;

      const res = await api.get('/usuarios/', { params });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolicitudes = async () => {
    setSolicitudesLoading(true);
    try {
      const params = {};
      if (solicitudSearch) params.search = solicitudSearch;
      if (solicitudEstadoFilter && solicitudEstadoFilter !== 'Todos') {
        params.estado = solicitudEstadoFilter;
      }
      const res = await api.get('/solicitudes_restablecimiento/', { params });
      setSolicitudes(res.data);
    } catch (err) {
      console.error("Error al cargar solicitudes de restablecimiento:", err);
    } finally {
      setSolicitudesLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchSolicitudes();
  }, []);

  useEffect(() => {
    if (activeMainTab === 'usuarios') {
      fetchUsers();
    } else {
      fetchSolicitudes();
    }
  }, [activeMainTab, search, selectedRole, includeInactive, solicitudSearch, solicitudEstadoFilter]);

  // Manejo de Modal de Usuario
  const handleOpenModal = (user = null) => {
    setUserFormError('');
    if (!roles || roles.length === 0) {
      fetchRoles();
    }
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: (user.nombre || '').replace(/[0-9]/g, ''),
        apellido: (user.apellido || '').replace(/[0-9]/g, ''),
        username: (user.username || '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ._]/g, ''),
        telefono: user.telefono || '',
        rol: user.rol || '',
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        apellido: '',
        username: '',
        telefono: '',
        rol: roles[0]?.id || '',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setUserFormError('');
  };

  // Validación estricta de texto (sin números) para nombres y apellidos
  const handleNombreChange = (e) => {
    // Elimina números al escribir o pegar
    const cleaned = e.target.value.replace(/[0-9]/g, '');
    setFormData(prev => ({ ...prev, nombre: cleaned }));
  };

  const handleApellidoChange = (e) => {
    // Elimina números al escribir o pegar
    const cleaned = e.target.value.replace(/[0-9]/g, '');
    setFormData(prev => ({ ...prev, apellido: cleaned }));
  };

  const handleUsernameChange = (e) => {
    // Solo letras (se permiten . y _ como separadores), sin números ni espacios
    const cleaned = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ._]/g, '');
    setFormData(prev => ({ ...prev, username: cleaned }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUserFormError('');

    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
    if (!soloLetras.test(formData.nombre.trim())) {
      setUserFormError("El campo Nombre solo acepta texto (letras y espacios), no se permiten números ni caracteres especiales.");
      return;
    }
    if (!soloLetras.test(formData.apellido.trim())) {
      setUserFormError("El campo Apellido solo acepta texto (letras y espacios), no se permiten números ni caracteres especiales.");
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ._]+$/.test(formData.username.trim())) {
      setUserFormError("El Nombre de Usuario solo acepta texto (letras, punto o guion bajo), no se permiten números.");
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 8)) {
      setUserFormError("La contraseña debe tener como mínimo 8 caracteres.");
      return;
    }

    try {
      if (editingUser) {
        const dataToSend = { ...formData };
        delete dataToSend.password; // Por política de seguridad, la contraseña nunca se actualiza desde editar
        await api.put(`/usuarios/${editingUser.id}/`, dataToSend);
        showToast('success', 'Usuario actualizado exitosamente.');
      } else {
        await api.post('/usuarios/', formData);
        showToast('success', 'Usuario creado exitosamente.');
      }
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      const data = err.response?.data;
      let msg = "Error al guardar el usuario.";
      if (data) {
        if (typeof data === 'string') {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (typeof data === 'object') {
          const errorList = Object.entries(data).map(([field, errList]) => {
            const fieldText = field === 'rol' ? 'Rol' : field.charAt(0).toUpperCase() + field.slice(1);
            const errText = Array.isArray(errList) ? errList.join(', ') : String(errList);
            return `${fieldText}: ${errText}`;
          });
          if (errorList.length > 0) {
            msg = errorList.join('\n');
          }
        }
      } else if (err.message) {
        msg = `Error de conexión: ${err.message}. Verifica que el servidor backend esté en ejecución.`;
      }
      setUserFormError(msg);
    }
  };

  const handleToggleSoftDelete = (user) => {
    setUserToConfirm(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggleActive = async () => {
    if (!userToConfirm) return;
    try {
      await api.post(`/usuarios/${userToConfirm.id}/toggle_activo/`);
      setIsConfirmOpen(false);
      showToast('success', `Usuario ${userToConfirm.nombre} ${userToConfirm.apellido} ${userToConfirm.activo ? 'deshabilitado' : 'activado'} correctamente.`);
      setUserToConfirm(null);
      fetchUsers();
    } catch (err) {
      showToast('error', err.response?.data?.detail || "Error al actualizar el estado del usuario.");
    }
  };

  // Manejo de Solicitudes de Restablecimiento
  const generarPinAleatorio = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return randomDigits.toString();
  };

  const handleOpenAuthModal = (sol) => {
    setSelectedSolicitudForAuth(sol);
    setPinTemporalInput(generarPinAleatorio());
    setAuthError('');
  };

  const handleConfirmAutorizar = async (e) => {
    e.preventDefault();
    if (!selectedSolicitudForAuth) return;

    if (!/^\d{6}$/.test(pinTemporalInput.trim())) {
      setAuthError("El PIN temporal debe contener exactamente 6 dígitos numéricos.");
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.post(`/solicitudes_restablecimiento/${selectedSolicitudForAuth.id_solicitud}/autorizar/`, {
        pin_temporal: pinTemporalInput.trim()
      });

      const updatedSol = res.data.solicitud;
      setSelectedSolicitudForAuth(null);
      await fetchSolicitudes();

      // Notificación del propio sistema
      showToast('success', res.data.message || `Clave temporal generada exitosamente para ${updatedSol.usuario_nombre} ${updatedSol.usuario_apellido}.`);

      // Abrir automáticamente la hoja de impresión para que el admin la emita
      setSelectedSolicitudForPrint(updatedSol);
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Error al autorizar el restablecimiento.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRechazarSolicitud = (sol) => {
    setConfirmDialog({
      title: 'Rechazar Solicitud de Restablecimiento',
      message: `¿Estás seguro de rechazar la solicitud de ticket ${sol.numero_ticket} para ${sol.usuario_nombre} ${sol.usuario_apellido}?`,
      confirmText: 'Rechazar Solicitud',
      confirmColor: 'var(--danger)',
      onConfirm: async () => {
        try {
          await api.post(`/solicitudes_restablecimiento/${sol.id_solicitud}/rechazar/`);
          showToast('success', `Solicitud de ticket ${sol.numero_ticket} rechazada.`);
          fetchSolicitudes();
        } catch (err) {
          showToast('error', err.response?.data?.detail || "Error al rechazar la solicitud.");
        }
      }
    });
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'Administrador': return <span className="badge-role badge-admin">Admin</span>;
      case 'Bodeguero': return <span className="badge-role badge-bodega">Bodeguero</span>;
      case 'Taller': return <span className="badge-role badge-taller">Taller</span>;
      case 'Logística': return <span className="badge-role badge-logistica">Logística</span>;
      default: return <span className="badge-role badge-admin">{roleName || 'Sin Rol'}</span>;
    }
  };

  const getEstadoSolicitudBadge = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>Pendiente</span>;
      case 'Aprobado':
        return <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>Autorizado / Activo</span>;
      case 'Completado':
        return <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>Clave Cambiada</span>;
      case 'Rechazado':
        return <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>Rechazado</span>;
      default:
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem' }}>{estado}</span>;
    }
  };

  const pendientesCount = solicitudes.filter(s => s.estado === 'Pendiente').length;

  return (
    <div>
      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Users size={22} style={{ color: 'var(--yellow)' }} />
            Gestión de Usuarios y Seguridad
          </h1>
        </div>

        {activeMainTab === 'usuarios' && (
          <button className="btn-primary" onClick={() => handleOpenModal()} style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserPlus size={16} />
            <span>Nuevo Usuario</span>
          </button>
        )}
      </div>

      {/* SUBPESTAÑA 1: DIRECTORIO DE USUARIOS */}
      {activeMainTab === 'usuarios' && (
        <>
          {/* Barra de Filtros y Búsqueda */}
          <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-container" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={15} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por nombre, apellido o usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ width: '150px', flex: '1 1 auto', minWidth: '130px' }}>
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Todos los roles</option>
                {roles.map(r => (
                  <option key={r.id} value={r.nombre}>{r.nombre}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIncludeInactive(!includeInactive)}
              style={{ fontSize: '0.8rem' }}
            >
              {includeInactive ? 'Ocultar Deshabilitados' : 'Mostrar Deshabilitados'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={fetchUsers}
              style={{ padding: '0.5rem' }}
              title="Recargar"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Tabla de Usuarios */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Nombre de Usuario (Login)</th>
                    <th>Teléfono</th>
                    <th>Rol del Sistema</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No hay usuarios para mostrar
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.45 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="avatar">
                              {(u.nombre[0] + u.apellido[0]).toUpperCase()}
                            </div>
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--white)', display: 'block' }}>
                                {u.nombre} {u.apellido}
                              </span>
                              {u.cambio_temporal && (
                                <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>
                                  ⚠️ Clave temporal (Cambio pendiente)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--yellow)', fontWeight: 600 }}>{u.username}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.telefono || '—'}</td>
                        <td>{getRoleBadge(u.rol_detail?.nombre || u.rol)}</td>
                        <td>
                          {u.activo ? (
                            <span style={{ color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600 }}>Activo</span>
                          ) : (
                            <span style={{ color: 'var(--danger)', fontSize: '0.78rem', fontWeight: 600 }}>Deshabilitado</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                              onClick={() => handleOpenModal(u)}
                              title="Editar Usuario"
                            >
                              <Edit2 size={13} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.75rem',
                                color: u.activo ? 'var(--danger)' : 'var(--success)',
                                borderColor: u.activo ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'
                              }}
                              onClick={() => handleToggleSoftDelete(u)}
                              title={u.activo ? 'Deshabilitar' : 'Activar'}
                            >
                              {u.activo ? 'Deshabilitar' : 'Activar'}
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
        </>
      )}

      {/* SUBPESTAÑA 2: SOLICITUDES DE RESTABLECIMIENTO */}
      {activeMainTab === 'solicitudes' && (
        <>
          <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
              <div className="input-container" style={{ flex: 1, minWidth: '220px' }}>
                <Search className="input-icon" size={15} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar por ticket, usuario o nombre..."
                  value={solicitudSearch}
                  onChange={(e) => setSolicitudSearch(e.target.value)}
                />
              </div>

              <div style={{ width: '160px', flex: '1 1 auto', minWidth: '130px' }}>
                <select
                  className="form-select"
                  value={solicitudEstadoFilter}
                  onChange={(e) => setSolicitudEstadoFilter(e.target.value)}
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Autorizado</option>
                  <option value="Completado">Clave Cambiada</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={fetchSolicitudes}
              style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Recargar solicitudes"
            >
              <RefreshCw size={15} className={solicitudesLoading ? 'spin' : ''} />
              <span style={{ fontSize: '0.8rem' }}>Actualizar</span>
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>N° Ticket</th>
                    <th>Usuario Solicitante</th>
                    <th>Motivo de Solicitud</th>
                    <th>Fecha Solicitud</th>
                    <th>Estado</th>
                    <th>Autorizado Por</th>
                    <th>PIN / Pase Temporal</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesLoading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Cargando solicitudes de restablecimiento...
                      </td>
                    </tr>
                  ) : solicitudes.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <KeyRound size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                          <span>No hay solicitudes de restablecimiento registradas con este filtro.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    solicitudes.map((s) => (
                      <tr key={s.id_solicitud} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ fontWeight: 800, color: 'var(--yellow)' }}>
                          {s.numero_ticket}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--white)' }}>
                            {s.usuario_nombre} {s.usuario_apellido}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            @{s.usuario_username} • {s.usuario_rol || 'Usuario'}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '200px' }}>
                          {s.motivo || 'Olvido de contraseña'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleString() : '—'}
                        </td>
                        <td>
                          {getEstadoSolicitudBadge(s.estado)}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {s.autorizado_por_nombre || '—'}
                        </td>
                        <td>
                          {s.pin_temporal ? (
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: 'rgba(234, 179, 8, 0.15)', color: 'var(--yellow)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.82rem' }}>
                              {s.pin_temporal}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Sin generar</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            {s.estado === 'Pendiente' && (
                              <>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                  onClick={() => handleOpenAuthModal(s)}
                                  title="Generar PIN y Autorizar"
                                >
                                  <KeyRound size={13} />
                                  <span>Generar PIN</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                                  onClick={() => handleRechazarSolicitud(s)}
                                  title="Rechazar Solicitud"
                                >
                                  <X size={13} />
                                </button>
                              </>
                            )}

                            {(s.estado === 'Aprobado' || s.estado === 'Completado') && (
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--white)' }}
                                onClick={() => setSelectedSolicitudForPrint(s)}
                                title="Ver e Imprimir Hoja de Autorización"
                              >
                                <Printer size={13} style={{ color: 'var(--yellow)' }} />
                                <span>Imprimir Hoja</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: CREAR / EDITAR USUARIO */}
      <ModalUsuario
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingUser={editingUser}
        formData={formData}
        setFormData={setFormData}
        handleNombreChange={handleNombreChange}
        handleApellidoChange={handleApellidoChange}
        handleUsernameChange={handleUsernameChange}
        roles={roles}
        userFormError={userFormError}
        onSubmit={handleSubmit}
      />

      {/* MODAL 2: AUTORIZAR Y GENERAR PIN TEMPORAL */}
      <ModalAutorizarPin
        isOpen={Boolean(selectedSolicitudForAuth)}
        onClose={() => setSelectedSolicitudForAuth(null)}
        solicitud={selectedSolicitudForAuth}
        pinTemporalInput={pinTemporalInput}
        setPinTemporalInput={setPinTemporalInput}
        authLoading={authLoading}
        authError={authError}
        onGenerarPin={() => setPinTemporalInput(generarPinAleatorio())}
        onSubmit={handleConfirmAutorizar}
      />

      {/* MODAL 3: HOJA DE AUTORIZACIÓN IMPRIMIBLE */}
      <ModalImprimirHoja
        isOpen={Boolean(selectedSolicitudForPrint)}
        onClose={() => setSelectedSolicitudForPrint(null)}
        solicitud={selectedSolicitudForPrint}
        onPrint={handlePrintDocument}
      />

      {/* DIÁLOGO CONFIRMACIÓN TOGGLE ACTIVO */}
      {isConfirmOpen && userToConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '380px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--white)' }}>
              Confirmar acción
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              ¿Deseas {userToConfirm.activo ? 'deshabilitar' : 'activar'} al usuario <strong>{userToConfirm.nombre} {userToConfirm.apellido}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setIsConfirmOpen(false);
                  setUserToConfirm(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  backgroundColor: userToConfirm.activo ? 'var(--danger)' : 'var(--success)',
                  borderColor: 'transparent'
                }}
                onClick={handleConfirmToggleActive}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO CONFIRMACIÓN GENERAL DEL SISTEMA */}
      <ConfirmDialog dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} />

      {/* NOTIFICACIÓN TOAST DEL SISTEMA */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Estilos para impresión limpia */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-auth-sheet, #printable-auth-sheet * {
            visibility: visible;
          }
          #printable-auth-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 1.5cm;
            box-shadow: none;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .modal-overlay {
            background-color: transparent !important;
            padding: 0 !important;
            position: static !important;
          }
          .print-modal-content {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
