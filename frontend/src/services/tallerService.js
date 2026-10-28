import api from './api';

export const tallerService = {
  // Órdenes de Trabajo
  getOrdenesTrabajo: (params) => api.get('/taller/ordenes-trabajo/', { params }),
  getSiguienteCorrelativoOT: () => api.get('/taller/ordenes-trabajo/siguiente_correlativo/'),
  crearOrdenTrabajo: (data) => api.post('/taller/ordenes-trabajo/', data),
  actualizarEstadoOT: (id, estado) => api.patch(`/taller/ordenes-trabajo/${id}/`, { estado }),

  // Vehículos (para asignación en OT)
  getVehiculos: (params) => api.get('/taller/vehiculos/', { params }),

  // Mecánicos
  getMecanicos: (params) => api.get('/taller/mecanicos/', { params }),
  crearMecanico: (data) => api.post('/taller/mecanicos/', data),
};

export default tallerService;
