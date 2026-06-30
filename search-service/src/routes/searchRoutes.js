const express = require('express');
const router = express.Router();
const {
  searchProducts,
  getSuggestions,
  getSearchHistory,
  clearSearchHistory
} = require('../controllers/searchController');

router.get('/', searchProducts);
router.get('/suggestions', getSuggestions);
router.get('/history', getSearchHistory);
router.delete('/history', clearSearchHistory);

module.exports = router;
