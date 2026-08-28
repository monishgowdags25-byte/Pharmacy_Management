import api from './api';

const dashboardService = {
  /**
   * Fetch aggregated dashboard statistics summary
   */
  getSummary: async () => {
    return await api.get('/dashboard/summary');
  }
};

export default dashboardService;
