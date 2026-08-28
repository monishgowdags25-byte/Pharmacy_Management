import api from './api';

const supplierService = {
  /**
   * Fetch all suppliers
   * @param {Object} params - { search, status }
   */
  getSuppliers: async (params) => {
    return await api.get('/suppliers', { params });
  },

  /**
   * Fetch single supplier with purchase history
   * @param {String} id - Supplier ID
   */
  getSupplierById: async (id) => {
    return await api.get(`/suppliers/${id}`);
  },

  /**
   * Register new supplier
   * @param {Object} supplierData
   */
  createSupplier: async (supplierData) => {
    return await api.post('/suppliers', supplierData);
  },

  /**
   * Update supplier details
   * @param {String} id - Supplier ID
   * @param {Object} supplierData
   */
  updateSupplier: async (id, supplierData) => {
    return await api.put(`/suppliers/${id}`, supplierData);
  },

  /**
   * Delete supplier
   * @param {String} id - Supplier ID
   */
  deleteSupplier: async (id) => {
    return await api.delete(`/suppliers/${id}`);
  }
};

export default supplierService;
