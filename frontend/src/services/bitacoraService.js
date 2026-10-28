import api from './api';

export const bitacoraService = {
  getRegistros: (params) => api.get('/bitacora/registros/', { params }),
  getMetricas: () => api.get('/bitacora/registros/metricas/'),
};

export default bitacoraService;
