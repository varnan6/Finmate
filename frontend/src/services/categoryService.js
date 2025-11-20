import api from './api';

export const categoryService = {
  // Get all categories
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single category
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create category
  createCategory: async (data) => {
    try {
      const response = await api.post('/categories', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update category
  updateCategory: async (id, data) => {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};