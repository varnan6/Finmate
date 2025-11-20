import api from './api';

export const analyticsService = {
  // Get dashboard analytics
  getDashboard: async (params = {}) => {
    try {
      const response = await api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get category spending
  getCategorySpending: async (params = {}) => {
    try {
      const response = await api.get('/analytics/category-spending', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};