const pool = require('../config/database');

const getAllCategories = async (req, res) => {
  try {
    const categoriesResult = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    res.json(categoriesResult.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const categoryResult = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [req.params.id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(categoryResult.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

const createCategory = async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    const insertResult = await pool.query(
      'INSERT INTO categories (name, icon, color) VALUES ($1, $2, $3) RETURNING id',
      [name, icon || '📁', color || '#6B7280']
    );

    res.status(201).json({
      id: insertResult.rows[0].id,
      name,
      icon: icon || '📁',
      color: color || '#6B7280',
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    const updateResult = await pool.query(
      'UPDATE categories SET name = $1, icon = $2, color = $3 WHERE id = $4',
      [name, icon, color, req.params.id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      id: parseInt(req.params.id),
      name,
      icon,
      color,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    // Check if category has expenses
    const expensesResult = await pool.query(
      'SELECT COUNT(*) as count FROM expenses WHERE category_id = $1',
      [req.params.id]
    );

    if (parseInt(expensesResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with existing expenses',
      });
    }

    const deleteResult = await pool.query(
      'DELETE FROM categories WHERE id = $1',
      [req.params.id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

