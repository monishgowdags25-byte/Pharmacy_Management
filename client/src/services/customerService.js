import api from './api';

const customerService = {
  /**
   * Fetch paginated list of customers
   * @param {Object} params - { search, page, limit }
   */
  getCustomers: async (params) => {
    return await api.get('/customers', { params });
  },

  /**
   * Fetch single customer details with purchase histories
   * @param {String} id
   */
  getCustomerById: async (id) => {
    return await api.get(`/customers/${id}`);
  },

  /**
   * Register new customer profile
   * @param {Object} data
   */
  createCustomer: async (data) => {
    return await api.post('/customers', data);
  },

  /**
   * Update customer profile coordinates
   * @param {String} id
   * @param {Object} data
   */
  updateCustomer: async (id, data) => {
    return await api.put(`/customers/${id}`, data);
  }
};

export default customerService;
