import api from './api';

export const logisticaService = {
  // Viajes
  getViajes: (params) => api.get('/logistica/viajes/', { params }),
  crearViaje: (data) => api.post('/logistica/viajes/', data),
  actualizarViaje: (id, data) => api.put(`/logistica/viajes/${id}/`, data),
  eliminarViaje: (id) => api.delete(`/logistica/viajes/${id}/`),

  // Clientes
  getClientes: (params) => api.get('/logistica/clientes/', { params }),
  crearCliente: (data) => api.post('/logistica/clientes/', data),
  actualizarCliente: (id, data) => api.put(`/logistica/clientes/${id}/`, data),
  eliminarCliente: (id) => api.delete(`/logistica/clientes/${id}/`),

  // Conductores
  getConductores: (params) => api.get('/logistica/conductores/', { params }),
  crearConductor: (data) => api.post('/logistica/conductores/', data),
  actualizarConductor: (id, data) => api.put(`/logistica/conductores/${id}/`, data),
  eliminarConductor: (id) => api.delete(`/logistica/conductores/${id}/`),

  // Vehículos de logística
  getVehiculos: (params) => api.get('/logistica/vehiculos/', { params }),
  crearVehiculo: (data) => api.post('/logistica/vehiculos/', data),
  actualizarVehiculo: (id, data) => api.put(`/logistica/vehiculos/${id}/`, data),
  eliminarVehiculo: (id) => api.delete(`/logistica/vehiculos/${id}/`),

  // Rollos
  getRollos: (params) => api.get('/logistica/rollos/', { params }),
  crearRollo: (data) => api.post('/logistica/rollos/', data),
  actualizarRollo: (id, data) => api.put(`/logistica/rollos/${id}/`, data),
  eliminarRollo: (id) => api.delete(`/logistica/rollos/${id}/`),
};

export default logisticaService;
