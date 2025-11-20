const express = require('express');
const router = express.Router();
const { validateExpense } = require('../middleware/validator');
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');

router.get('/', getAllExpenses);
router.get('/:id', getExpenseById);
router.post('/', validateExpense, createExpense);
router.put('/:id', validateExpense, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;