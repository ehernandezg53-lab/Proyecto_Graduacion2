import api from './api';

export const bodegaService = {
  // Repuestos / Inventario
  getRepuestos: (params) => api.get('/bodega/repuestos/', { params }),
  getSiguienteCodigo: () => api.get('/bodega/repuestos/siguiente_codigo/'),
  crearRepuesto: (data) => api.post('/bodega/repuestos/', data),
  actualizarRepuesto: (id, data) => api.put(`/bodega/repuestos/${id}/`, data),
  eliminarRepuesto: (id) => api.delete(`/bodega/repuestos/${id}/`),

  // Órdenes de Ingreso
  getOrdenesIngreso: (params) => api.get('/bodega/ordenes-ingreso/', { params }),
  getSiguienteCorrelativoIngreso: () => api.get('/bodega/ordenes-ingreso/siguiente_correlativo/'),
  crearOrdenIngreso: (data) => api.post('/bodega/ordenes-ingreso/', data),
  procesarIngreso: (id) => api.post(`/bodega/ordenes-ingreso/${id}/procesar_ingreso/`),

  // Salidas de Repuestos
  getSalidasRepuestos: (params) => api.get('/bodega/salidas-repuestos/', { params }),
  crearSalidaRepuesto: (data) => api.post('/bodega/salidas-repuestos/', data),

  // Órdenes de Trabajo vinculadas
  getOrdenesTrabajo: () => api.get('/taller/ordenes-trabajo/'),
};

export default bodegaService;
