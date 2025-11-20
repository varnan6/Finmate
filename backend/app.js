const express = require('express');
const cors = require('cors');

const categoryRoutes = require('./routes/categoryRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const errorHandler = require('./middleware/errorHandler');
const pool = require('./config/database');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', async (req, res) => {
  try {
    const [expenseCount] = await pool.query('SELECT COUNT(*) as count FROM expenses');
    const [categoryCount] = await pool.query('SELECT COUNT(*) as count FROM categories');

    res.json({
      status: 'ok',
      message: 'Server is running',
      database: 'connected',
      data: {
        totalExpenses: expenseCount[0].count,
        totalCategories: categoryCount[0].count
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.use(errorHandler);

module.exports = app;