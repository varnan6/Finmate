import api from './api';

export const expenseService = {
  // Get all transactions
  getAllTransactions: async (params = {}) => {
    try {
      const response = await api.get('/expenses', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single transaction
  getTransactionById: async (id) => {
    try {
      const response = await api.get(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create transaction
  createTransaction: async (data) => {
    try {
      // Map frontend fields to backend fields
      const backendData = {
        title: data.description,
        amount: parseFloat(data.amount),
        type: data.type,
        category_id: data.type === 'income' ? null : parseInt(data.category),
        date: data.date,
        description: data.description
      };
      
      const response = await api.post('/expenses', backendData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update transaction
  updateTransaction: async (id, data) => {
    try {
      // Map frontend fields to backend fields
      const backendData = {
        title: data.description,
        amount: parseFloat(data.amount),
        type: data.type,
        category_id: data.type === 'income' ? null : parseInt(data.category),
        date: data.date,
        description: data.description
      };
      
      const response = await api.put(`/expenses/${id}`, backendData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    try {
      const response = await api.delete(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};