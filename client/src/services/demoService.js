import api from './api';

const demoService = {
  seedAll: () => api.post('/demo/all'),
  seedCategories: () => api.post('/demo/categories'),
  seedMedicines: () => api.post('/demo/medicines'),
  seedInventory: () => api.post('/demo/inventory'),
  seedSuppliers: () => api.post('/demo/suppliers'),
  seedPurchases: () => api.post('/demo/purchases'),
  seedSales: () => api.post('/demo/sales'),
  seedCustomers: () => api.post('/demo/customers'),
  seedPrescriptions: () => api.post('/demo/prescriptions'),
  seedReturns: () => api.post('/demo/returns'),
  seedExpenses: () => api.post('/demo/expenses'),
  seedNotifications: () => api.post('/demo/notifications'),
  seedAuditLogs: () => api.post('/demo/audit-logs'),
  seedUsers: () => api.post('/demo/users'),
  clearDemo: () => api.post('/demo/clear'),
  getStatus: () => api.get('/demo/status')
};

export default demoService;
