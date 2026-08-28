import api from './api';

const returnService = {
  /**
   * Fetch paginated list of returns
   * @param {Object} params - { search, page, limit }
   */
  getReturns: async (params) => {
    return await api.get('/returns', { params });
  },

  /**
   * Fetch single returns details with items list
   * @param {String} id
   */
  getReturnById: async (id) => {
    return await api.get(`/returns/${id}`);
  },

  /**
   * Create returns slip
   * @param {Object} returnData - { saleId, reason, refundMethod, refundAmount, items }
   */
  createReturn: async (returnData) => {
    return await api.post('/returns', returnData);
  }
};

export default returnService;
