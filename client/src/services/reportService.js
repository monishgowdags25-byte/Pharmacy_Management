import api from './api';

const reportService = {
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getPurchaseReport: (params) => api.get('/reports/purchases', { params }),
  getInventoryReport: () => api.get('/reports/inventory'),
  getProfitReport: (params) => api.get('/reports/profit', { params }),
  getMedicinePerformance: (params) => api.get('/reports/medicines', { params }),
  getSupplierReport: () => api.get('/reports/suppliers'),
};

export default reportService;
