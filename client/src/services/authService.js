import api from './api';

const authService = {
  /**
   * Log in user
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    // Standard MERN auth path
    const response = await api.post('/auth/login', credentials);
    if (response?.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  },

  /**
   * Fetch currently authenticated user profile
   */
  getProfile: async () => {
    return await api.get('/auth/profile');
  },

  /**
   * Log out user and clear storage
   */
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

export default authService;
