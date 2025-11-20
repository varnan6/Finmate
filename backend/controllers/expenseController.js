const pool = require('../config/database');

const getAllExpenses = async (req, res) => {
  const { category, startDate, endDate, sortBy = 'date', order = 'DESC', search } = req.query;

  try {
    let query = `
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND e.category_id = ?';
      params.push(category);
    }

    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }

    if (search) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const validSortColumns = ['date', 'amount', 'title'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY e.${sortColumn} ${sortOrder}`;

    const [expenses] = await pool.query(query, params);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const [expenses] = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expenses[0]);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

const createExpense = async (req, res) => {
  const { title, amount, type, category_id, date, description } = req.body;

  try {
    // For income, category_id should be null
    const finalCategoryId = type === 'income' ? null : (category_id || null);
    const finalType = type || 'expense'; // Default to 'expense' if not provided

    const [result] = await pool.query(
      'INSERT INTO expenses (title, amount, type, category_id, date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [title, amount, finalType, finalCategoryId, date, description || null]
    );

    const [newExpense] = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      ...newExpense[0],
      message: 'Transaction added successfully'
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

const updateExpense = async (req, res) => {
  const { title, amount, type, category_id, date, description } = req.body;

  try {
    // For income, category_id should be null
    const finalCategoryId = type === 'income' ? null : (category_id || null);
    const finalType = type || 'expense'; // Default to 'expense' if not provided

    const [result] = await pool.query(
      'UPDATE expenses SET title = ?, amount = ?, type = ?, category_id = ?, date = ?, description = ? WHERE id = ?',
      [title, amount, finalType, finalCategoryId, date, description || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const [updatedExpense] = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    res.json({
      ...updatedExpense[0],
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM expenses WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};