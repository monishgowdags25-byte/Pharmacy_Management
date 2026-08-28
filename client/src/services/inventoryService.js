import api from './api';

const inventoryService = {
  /**
   * Fetch inventory batches
   * @param {Object} params - { search, status, medicineId }
   */
  getBatches: async (params) => {
    return await api.get('/inventory/batches', { params });
  },

  /**
   * Fetch current inventory alerts (Expired, Expiring, Low Stock counts)
   */
  getAlerts: async () => {
    return await api.get('/inventory/alerts');
  },

  /**
   * Fetch ledger stock log entries
   * @param {Object} params - { medicineId, batchId, type }
   */
  getHistory: async (params) => {
    return await api.get('/inventory/history', { params });
  },

  /**
   * Post manual stock adjustment
   * @param {Object} data - { batchId, quantity, type, reason }
   */
  adjustStock: async (data) => {
    return await api.post('/inventory/adjust', data);
  }
};

export default inventoryService;
