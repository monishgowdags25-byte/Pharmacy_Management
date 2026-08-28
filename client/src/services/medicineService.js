import api from './api';

const medicineService = {
  /**
   * Fetch paginated and filtered medicines
   * @param {Object} params - { search, category, status, dosageForm, sort, page, limit }
   */
  getMedicines: async (params) => {
    return await api.get('/medicines', { params });
  },

  /**
   * Fetch single medicine details
   * @param {String} id - Medicine ID
   */
  getMedicineById: async (id) => {
    return await api.get(`/medicines/${id}`);
  },

  /**
   * Create new medicine
   * @param {Object} medicineData
   */
  createMedicine: async (medicineData) => {
    return await api.post('/medicines', medicineData);
  },

  /**
   * Update medicine
   * @param {String} id - Medicine ID
   * @param {Object} medicineData
   */
  updateMedicine: async (id, medicineData) => {
    return await api.put(`/medicines/${id}`, medicineData);
  },

  /**
   * Delete medicine
   * @param {String} id - Medicine ID
   */
  deleteMedicine: async (id) => {
    return await api.delete(`/medicines/${id}`);
  }
};

export default medicineService;
