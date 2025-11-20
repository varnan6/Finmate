const pool = require('../config/database');

const getDashboard = async (req, res) => {
  const { month, year } = req.query;

  try {
    // Total expenses
    const [totalResult] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses'
    );

    // Monthly total
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const [monthlyResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM expenses 
       WHERE MONTH(date) = ? AND YEAR(date) = ?`,
      [currentMonth, currentYear]
    );

    // Spending by category
    const [categorySpending] = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        COALESCE(SUM(e.amount), 0) as total,
        COUNT(e.id) as count
       FROM categories c
       LEFT JOIN expenses e ON c.id = e.category_id
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total DESC`
    );

    const highestCategory = categorySpending[0] || null;

    // Monthly trend (last 6 months)
    const [monthlyTrend] = await pool.query(
      `SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(amount) as total
       FROM expenses
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month ASC`
    );

    // Recent expenses
    const [recentExpenses] = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       ORDER BY e.date DESC, e.created_at DESC
       LIMIT 5`
    );

    res.json({
      totalExpenses: parseFloat(totalResult[0].total),
      monthlyTotal: parseFloat(monthlyResult[0].total),
      highestSpendingCategory: highestCategory,
      categorySpending: categorySpending.map(cat => ({
        ...cat,
        total: parseFloat(cat.total)
      })),
      monthlyTrend: monthlyTrend.map(m => ({
        ...m,
        total: parseFloat(m.total)
      })),
      recentExpenses: recentExpenses.map(exp => ({
        ...exp,
        amount: parseFloat(exp.amount)
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

const getCategorySpending = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let query = `
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        COALESCE(SUM(e.amount), 0) as total,
        COUNT(e.id) as count
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id
    `;
    const params = [];

    if (startDate || endDate) {
      query += ' WHERE 1=1';
      if (startDate) {
        query += ' AND e.date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND e.date <= ?';
        params.push(endDate);
      }
    }

    query += ' GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC';

    const [results] = await pool.query(query, params);

    res.json(results.map(cat => ({
      ...cat,
      total: parseFloat(cat.total)
    })));
  } catch (error) {
    console.error('Error fetching category spending:', error);
    res.status(500).json({ error: 'Failed to fetch category spending' });
  }
};

module.exports = {
  getDashboard,
  getCategorySpending
};