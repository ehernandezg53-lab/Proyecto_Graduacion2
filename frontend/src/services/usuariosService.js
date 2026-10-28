import api from './api';

export const usuariosService = {
  // Usuarios
  getUsuarios: (params) => api.get('/usuarios/', { params }),
  crearUsuario: (data) => api.post('/usuarios/', data),
  actualizarUsuario: (id, data) => api.put(`/usuarios/${id}/`, data),
  eliminarUsuario: (id) => api.delete(`/usuarios/${id}/`),
  toggleActivo: (id) => api.post(`/usuarios/${id}/toggle_activo/`),

  // Roles
  getRoles: () => api.get('/roles/'),

  // Solicitudes de restablecimiento
  getSolicitudes: (params) => api.get('/solicitudes_restablecimiento/', { params }),
  solicitarRestablecimiento: (data) => api.post('/auth/solicitar_restablecimiento/', data),
  autorizarSolicitud: (id, data) => api.post(`/solicitudes_restablecimiento/${id}/autorizar/`, data),
  rechazarSolicitud: (id) => api.post(`/solicitudes_restablecimiento/${id}/rechazar/`),
  cambiarPasswordObligatorio: (data) => api.post('/auth/cambiar_password_obligatorio/', data),

  // Sesión
  getCurrentUser: () => api.get('/auth/me/'),
  login: (credentials) => api.post('/auth/login/', credentials),
};

export default usuariosService;
