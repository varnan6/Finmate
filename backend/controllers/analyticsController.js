const pool = require('../config/database');

const getDashboard = async (req, res) => {
  const { month, year } = req.query;
  try {
    // Total expenses
    const totalResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses'
    );

    // Monthly total
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    const monthlyResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2`,
      [currentMonth, currentYear]
    );

    // Spending by category
    const categorySpendingResult = await pool.query(
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
    const categorySpending = categorySpendingResult.rows;
    const highestCategory = categorySpending[0] || null;

    // Monthly trend (last 6 months)
    const monthlyTrendResult = await pool.query(
      `SELECT
         TO_CHAR(date, 'YYYY-MM') as month,
         SUM(amount) as total
       FROM expenses
       WHERE date >= (CURRENT_DATE - INTERVAL '6 months')
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month ASC`
    );
    const monthlyTrend = monthlyTrendResult.rows;

    // Recent expenses
    const recentExpensesResult = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       ORDER BY e.date DESC, e.created_at DESC
       LIMIT 5`
    );
    const recentExpenses = recentExpensesResult.rows;

    res.json({
      totalExpenses: parseFloat(totalResult.rows[0].total),
      monthlyTotal: parseFloat(monthlyResult.rows[0].total),
      highestSpendingCategory: highestCategory,
      categorySpending: categorySpending.map(cat => ({
        ...cat,
        total: parseFloat(cat.total),
      })),
      monthlyTrend: monthlyTrend.map(m => ({
        ...m,
        total: parseFloat(m.total),
      })),
      recentExpenses: recentExpenses.map(exp => ({
        ...exp,
        amount: parseFloat(exp.amount),
      })),
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
    let paramIndex = 1;

    if (startDate || endDate) {
      query += ' WHERE 1=1';
      if (startDate) {
        query += ` AND e.date >= $${paramIndex++}`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND e.date <= $${paramIndex++}`;
        params.push(endDate);
      }
    }
    query += ' GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC';

    const resultsResult = await pool.query(query, params);
    res.json(resultsResult.rows.map(cat => ({
      ...cat,
      total: parseFloat(cat.total),
    })));
  } catch (error) {
    console.error('Error fetching category spending:', error);
    res.status(500).json({ error: 'Failed to fetch category spending' });
  }
};

module.exports = {
  getDashboard,
  getCategorySpending,
};

