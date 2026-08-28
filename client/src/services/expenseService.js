import api from './api';

const expenseService = {
  /**
   * Fetch paginated list of expenses with filters
   * @param {Object} params - { search, category, startDate, endDate, page, limit }
   */
  getExpenses: async (params) => {
    return await api.get('/expenses', { params });
  },

  /**
   * Create new expense voucher record
   * @param {Object} data - { title, description, amount, category, date }
   */
  createExpense: async (data) => {
    return await api.post('/expenses', data);
  },

  /**
   * Update expense record voucher
   * @param {String} id
   * @param {Object} data
   */
  updateExpense: async (id, data) => {
    return await api.put(`/expenses/${id}`, data);
  },

  /**
   * Delete expense voucher record
   * @param {String} id
   */
  deleteExpense: async (id) => {
    return await api.delete(`/expenses/${id}`);
  }
};

export default expenseService;
