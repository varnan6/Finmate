const pool = require('../config/database');

const validateExpense = async (req, res, next) => {
  const { title, amount, date, type } = req.body;

  // Basic validation
  if (!title || !amount || !date) {
    return res.status(400).json({
      error: 'Title, amount, and date are required'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  // Validate type
  if (type && !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either income or expense' });
  }

  // Only validate category for expenses (NOT for income)
  if (type === 'expense') {
    const { category_id } = req.body;
    
    if (!category_id) {
      return res.status(400).json({ error: 'Category is required for expenses' });
    }

    // Check if category exists
    try {
      const [categories] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categories.length === 0) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({ error: 'Validation failed' });
    }
  } else if (type === 'income') {
    // For income, category_id should be null
    const { category_id } = req.body;
    
    if (category_id) {
      try {
        const [categories] = await pool.query(
          'SELECT id FROM categories WHERE id = ?',
          [category_id]
        );

        if (categories.length === 0) {
          return res.status(400).json({ error: 'Invalid category' });
        }
      } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({ error: 'Validation failed' });
      }
    }
  }

  next();
};

// Separate validator for updates that fetches the current type if not provided
const validateExpenseUpdate = async (req, res, next) => {
  const { title, amount, date, type, category_id } = req.body;
  const expenseId = req.params.id;

  // Basic validation
  if (!title || !amount || !date) {
    return res.status(400).json({
      error: 'Title, amount, and date are required'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  // Validate type if provided
  if (type && !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either income or expense' });
  }

  try {
    // Get current expense type if type is not provided in the request
    let currentType = type;
    if (!currentType) {
      const [expenses] = await pool.query(
        'SELECT type FROM expenses WHERE id = ?',
        [expenseId]
      );

      if (expenses.length === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      currentType = expenses[0].type;
    }

    // Validate category based on type
    if (currentType === 'expense') {
      if (!category_id) {
        return res.status(400).json({ error: 'Category is required for expenses' });
      }

      // Check if category exists
      const [categories] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categories.length === 0) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    } else if (currentType === 'income' && category_id) {
      // If income and category is provided, validate it exists
      const [categories] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categories.length === 0) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Validation failed' });
  }
};

const validateCategory = (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  next();
};

module.exports = {
  validateExpense,
  validateExpenseUpdate,
  validateCategory
};