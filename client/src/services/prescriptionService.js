import api from './api';

const prescriptionService = {
  /**
   * Fetch paginated list of prescription logs
   * @param {Object} params - { search, status, page, limit }
   */
  getPrescriptions: async (params) => {
    return await api.get('/prescriptions', { params });
  },

  /**
   * Fetch single prescription details with line items
   * @param {String} id
   */
  getPrescriptionById: async (id) => {
    return await api.get(`/prescriptions/${id}`);
  },

  /**
   * Upload new doctor prescription
   * @param {Object} data - { customerId, doctorName, doctorRegistrationNumber, items }
   */
  createPrescription: async (data) => {
    return await api.post('/prescriptions', data);
  },

  /**
   * Update prescription verification status
   * @param {String} id
   * @param {String} status - 'VERIFIED' | 'REJECTED'
   */
  updatePrescriptionStatus: async (id, status) => {
    return await api.put(`/prescriptions/${id}/status`, { status });
  }
};

export default prescriptionService;
