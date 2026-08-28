import api from './api';

const purchaseService = {
  /**
   * Fetch paginated purchases list
   * @param {Object} params - { search, status, paymentStatus, supplierId }
   */
  getPurchases: async (params) => {
    return await api.get('/purchases', { params });
  },

  /**
   * Fetch single purchase detail (invoice view)
   * @param {String} id - Purchase ID
   */
  getPurchaseById: async (id) => {
    return await api.get(`/purchases/${id}`);
  },

  /**
   * Create drafted purchase order
   * @param {Object} data
   */
  createPurchase: async (data) => {
    return await api.post('/purchases', data);
  },

  /**
   * Update draft purchase order details
   * @param {String} id
   * @param {Object} data
   */
  updatePurchase: async (id, data) => {
    return await api.put(`/purchases/${id}`, data);
  },

  /**
   * Complete draft purchase and restock inventory
   * @param {String} id
   */
  completePurchase: async (id) => {
    return await api.put(`/purchases/${id}/complete`);
  },

  /**
   * Cancel draft purchase order
   * @param {String} id
   */
  cancelPurchase: async (id) => {
    return await api.put(`/purchases/${id}/cancel`);
  }
};

export default purchaseService;
