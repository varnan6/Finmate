const pool = require('../config/database');

const getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [req.params.id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(categories[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

const createCategory = async (req, res) => {
  const { name, icon, color } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
      [name, icon || '📁', color || '#6B7280']
    );

    res.status(201).json({
      id: result.insertId,
      name,
      icon: icon || '📁',
      color: color || '#6B7280',
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  const { name, icon, color } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?',
      [name, icon, color, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      id: parseInt(req.params.id),
      name,
      icon,
      color,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    // Check if category has expenses
    const [expenses] = await pool.query(
      'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?',
      [req.params.id]
    );

    if (expenses[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with existing expenses'
      });
    }

    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
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
  deleteCategory
};