const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getCategorySpending
} = require('../controllers/analyticsController');

router.get('/dashboard', getDashboard);
router.get('/category-spending', getCategorySpending);

module.exports = router;
