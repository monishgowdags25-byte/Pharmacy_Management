import api from './api';

const saleService = {
  /**
   * Fetch paginated list of sales transaction history
   * @param {Object} params - { search, status, paymentMethod, customerId }
   */
  getSales: async (params) => {
    return await api.get('/sales', { params });
  },

  /**
   * Fetch single sale details with line items
   * @param {String} id - Sale ID
   */
  getSaleById: async (id) => {
    return await api.get(`/sales/${id}`);
  },

  /**
   * Submit POS cart to complete transaction checkout
   * @param {Object} saleData - { customerId, discountAmount, taxAmount, paymentMethod, items }
   */
  createSale: async (saleData) => {
    return await api.post('/sales', saleData);
  }
};

export default saleService;
