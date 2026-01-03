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
    let paramIndex = 1;

    if (category) {
      query += ` AND e.category_id = $${paramIndex++}`;
      params.push(category);
    }
    if (startDate) {
      query += ` AND e.date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND e.date <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (search) {
      query += ` AND (e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex + 1})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const validSortColumns = ['date', 'amount', 'title'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY e.${sortColumn} ${sortOrder}`;

    const expensesResult = await pool.query(query, params);
    res.json(expensesResult.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const expenseResult = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (expenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expenseResult.rows[0]);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

const createExpense = async (req, res) => {
  const { title, amount, type, category_id, date, description } = req.body;
  try {
    const finalCategoryId = type === 'income' ? null : (category_id || null);
    const finalType = type || 'expense';

    const insertResult = await pool.query(
      'INSERT INTO expenses (title, amount, type, category_id, date, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [title, amount, finalType, finalCategoryId, date, description || null]
    );
    const newId = insertResult.rows[0].id;

    const newExpenseResult = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = $1`,
      [newId]
    );

    res.status(201).json({
      ...newExpenseResult.rows[0],
      message: 'Transaction added successfully',
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

const updateExpense = async (req, res) => {
  const { title, amount, type, category_id, date, description } = req.body;
  try {
    const finalCategoryId = type === 'income' ? null : (category_id || null);
    const finalType = type || 'expense';

    const updateResult = await pool.query(
      'UPDATE expenses SET title = $1, amount = $2, type = $3, category_id = $4, date = $5, description = $6 WHERE id = $7',
      [title, amount, finalType, finalCategoryId, date, description || null, req.params.id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const updatedExpenseResult = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    res.json({
      ...updatedExpenseResult.rows[0],
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const deleteResult = await pool.query(
      'DELETE FROM expenses WHERE id = $1',
      [req.params.id]
    );

    if (deleteResult.rowCount === 0) {
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
  deleteExpense,
};

