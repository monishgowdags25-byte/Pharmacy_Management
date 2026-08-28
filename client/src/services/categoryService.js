import api from './api';

const categoryService = {
  /**
   * Fetch all categories
   * @param {String} search - Search query filter
   */
  getCategories: async (search) => {
    return await api.get('/categories', { params: { search } });
  },

  /**
   * Create new category
   * @param {Object} categoryData - { name, description }
   */
  createCategory: async (categoryData) => {
    return await api.post('/categories', categoryData);
  },

  /**
   * Update category
   * @param {String} id - Category ID
   * @param {Object} categoryData - { name, description }
   */
  updateCategory: async (id, categoryData) => {
    return await api.put(`/categories/${id}`, categoryData);
  },

  /**
   * Delete category
   * @param {String} id - Category ID
   */
  deleteCategory: async (id) => {
    return await api.delete(`/categories/${id}`);
  }
};

export default categoryService;
