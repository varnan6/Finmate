const express = require('express');
const router = express.Router();
const { validateCategory } = require('../middleware/validator');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', validateCategory, createCategory);
router.put('/:id', validateCategory, updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
