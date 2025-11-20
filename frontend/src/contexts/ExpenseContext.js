import React, { createContext, useContext, useState, useEffect } from 'react';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import { analyticsService } from '../services/analyticsService';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  // State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    loadDarkModePreference();
  }, []);

  const loadDarkModePreference = () => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load categories and transactions in parallel
      const [categoriesData, transactionsData] = await Promise.all([
        categoryService.getAllCategories(),
        expenseService.getAllTransactions()
      ]);

      // Map backend response to frontend format
      const mappedTransactions = transactionsData.map(mapBackendToFrontend);
      const mappedCategories = categoriesData.map(cat => ({
        id: cat.id.toString(),
        name: cat.name,
        color: cat.color,
        icon: cat.icon
      }));

      setCategories(mappedCategories);
      setTransactions(mappedTransactions);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Map backend response to frontend format
  // Map backend response to frontend format
  const mapBackendToFrontend = (backendData) => {
    return {
      id: backendData.id.toString(),
      description: backendData.title,
      amount: parseFloat(backendData.amount) || 0,
      date: backendData.date,
      category: backendData.category_id ? backendData.category_id.toString() : null,
      type: backendData.type || 'expense', // Ensure type is always set
      // Include category details from join
      category_name: backendData.category_name,
      category_icon: backendData.category_icon,
      category_color: backendData.category_color
    };
  };

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  // Add Transaction
  const addTransaction = async (transaction) => {
    try {
      const response = await expenseService.createTransaction(transaction);
      const newTransaction = mapBackendToFrontend(response);
      setTransactions((prev) => [...prev, newTransaction]);
      return newTransaction;
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw new Error(err.response?.data?.error || 'Failed to add transaction');
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id) => {
    try {
      await expenseService.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id.toString()));
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw new Error(err.response?.data?.error || 'Failed to delete transaction');
    }
  };

  // Edit Transaction
  const editTransaction = async (transaction) => {
    try {
      const response = await expenseService.updateTransaction(transaction.id, transaction);
      const updatedTransaction = mapBackendToFrontend(response);
      
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );
      
      return updatedTransaction;
    } catch (err) {
      console.error('Error editing transaction:', err);
      throw new Error(err.response?.data?.error || 'Failed to update transaction');
    }
  };

  // Add Category
  const addCategory = async (category) => {
    try {
      const response = await categoryService.createCategory(category);
      const newCategory = {
        id: response.id.toString(),
        name: response.name,
        color: response.color,
        icon: response.icon
      };
      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      console.error('Error adding category:', err);
      throw new Error(err.response?.data?.error || 'Failed to add category');
    }
  };

  // Delete Category
  const deleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id.toString()));
    } catch (err) {
      console.error('Error deleting category:', err);
      throw new Error(err.response?.data?.error || 'Failed to delete category');
    }
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  // Import Data
  const importData = async (data) => {
    try {
      // Import categories first
      if (data.categories && data.categories.length > 0) {
        for (const category of data.categories) {
          try {
            await categoryService.createCategory(category);
          } catch (err) {
            console.warn('Category already exists or failed:', category.name);
          }
        }
      }

      // Import transactions
      if (data.transactions && data.transactions.length > 0) {
        for (const transaction of data.transactions) {
          try {
            await expenseService.createTransaction(transaction);
          } catch (err) {
            console.warn('Failed to import transaction:', transaction.description);
          }
        }
      }

      // Reload all data
      await loadInitialData();
    } catch (err) {
      console.error('Error importing data:', err);
      throw new Error('Failed to import data');
    }
  };

  // Load Demo Data (not implemented - would need backend support)
  const loadDemoData = () => {
    alert('Demo data feature requires backend implementation. Please add sample data manually.');
  };

  // Clear Demo Data (not implemented)
  const clearDemoData = () => {
    alert('This feature is not available with backend integration.');
  };

  // Category data for charts
  const expensesByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(t.amount);
      return acc;
    }, {});

  const categoryData = Object.entries(expensesByCategory).map(
    ([categoryId, amount]) => {
      const category = categories.find((cat) => cat.id === categoryId) || {
        name: categoryId,
        color: '#888',
        icon: '📁'
      };
      return {
        id: categoryId,
        name: category.name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: category.color,
      };
    }
  );

  // Get monthly data
    const getMonthlyData = () => {
    const months = {};

    transactions.forEach((transaction) => {
      try {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!months[monthKey]) {
          months[monthKey] = {
            income: 0,
            expense: 0,
            label: new Date(date.getFullYear(), date.getMonth(), 1)
              .toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            year: date.getFullYear(),
            month: date.getMonth() + 1
          };
        }

        // Ensure type exists and is valid
        const transactionType = transaction.type || 'expense';
        const amount = Number(transaction.amount) || 0;

        if (transactionType === 'income') {
          months[monthKey].income += amount;
        } else if (transactionType === 'expense') {
          months[monthKey].expense += amount;
        }
      } catch (error) {
        console.error('Error processing transaction for monthly data:', transaction, error);
      }
    });

    // Convert to array and sort by year-month
    return Object.entries(months)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, data]) => data);
  };


  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        categories,
        darkMode,
        loading,
        error,
        isDemoData: false, // No demo data with backend
        totalIncome,
        totalExpenses,
        netBalance,
        categoryData,
        getMonthlyData,
        addTransaction,
        deleteTransaction,
        editTransaction,
        addCategory,
        deleteCategory,
        importData,
        loadDemoData,
        clearDemoData,
        toggleDarkMode,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenseContext = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenseContext must be used within an ExpenseProvider');
  }
  return context;
};