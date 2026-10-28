import api from './api';

export const reportesService = {
  // KPIs del Dashboard Ejecutivo
  getDashboardKpis: async () => {
    const res = await api.get('/reportes/dashboard/');
    return res.data;
  },

  // 1. Reportes de Bodega
  getKardex: async (params = {}) => {
    const res = await api.get('/reportes/bodega/kardex/', { params });
    return res.data;
  },

  getStockCritico: async () => {
    const res = await api.get('/reportes/bodega/stock-critico/');
    return res.data;
  },

  getValorizacion: async () => {
    const res = await api.get('/reportes/bodega/valorizacion/');
    return res.data;
  },

  // 2. Reportes de Taller
  getTallerOrdenes: async (params = {}) => {
    const res = await api.get('/reportes/taller/ordenes/', { params });
    return res.data;
  },

  getHistorialVehiculo: async (params = {}) => {
    const res = await api.get('/reportes/taller/historial-vehiculo/', { params });
    return res.data;
  },

  getProductividadMecanicos: async (params = {}) => {
    const res = await api.get('/reportes/taller/productividad-mecanicos/', { params });
    return res.data;
  },

  // 3. Reportes de Logística
  getViajes: async (params = {}) => {
    const res = await api.get('/reportes/logistica/viajes/', { params });
    return res.data;
  },

  getRollos: async (params = {}) => {
    const res = await api.get('/reportes/logistica/rollos/', { params });
    return res.data;
  },

  getLicencias: async () => {
    const res = await api.get('/reportes/logistica/licencias/');
    return res.data;
  },

  // 4. Reportes de Auditoría / Bitácora
  getAuditoria: async (params = {}) => {
    const res = await api.get('/reportes/bitacora/auditoria/', { params });
    return res.data;
  },

  // Helper para descarga de archivos binarios (Excel o CSV)
  exportFile: async (endpoint, params = {}, format = 'excel', defaultFilename = 'reporte') => {
    try {
      const response = await api.get(endpoint, {
        params: { ...params, export: format },
        responseType: 'blob',
      });

      const mimeType =
        format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;';
      const extension = format === 'excel' ? 'xlsx' : 'csv';

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${defaultFilename}_${new Date().toISOString().slice(0, 10)}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Error al exportar archivo:', err);
      throw err;
    }
  },
};

export default reportesService;
