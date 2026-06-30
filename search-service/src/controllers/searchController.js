const SearchLog = require('../models/SearchLog');
const axios = require('axios');

const getProductServiceUrl = () => process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001';

const searchProducts = async (req, res) => {
  try {
    const { q = '', category = '', minPrice = '', maxPrice = '', page = 1, limit = 10 } = req.query;

    const queryParams = new URLSearchParams({
      search: q,
      category,
      minPrice,
      maxPrice,
      page,
      limit
    }).toString();

    const response = await axios.get(`${getProductServiceUrl()}/api/products?${queryParams}`);
    
    // Log the search query
    if (q) {
      const searchLog = new SearchLog({
        query: q,
        resultsCount: response.data.totalProducts || response.data.length || 0,
        filters: { category, minPrice, maxPrice }
      });
      await searchLog.save();
    }

    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const { q = '' } = req.query;
    if (!q) {
      return res.json([]);
    }

    const response = await axios.get(`${getProductServiceUrl()}/api/products?search=${q}&limit=5`);
    const products = response.data.products || response.data;
    
    const suggestions = products.map(p => p.name);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suggestions', error: error.message });
  }
};

const getSearchHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await SearchLog.find().sort({ createdAt: -1 }).limit(limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearSearchHistory = async (req, res) => {
  try {
    await SearchLog.deleteMany({});
    res.json({ message: 'Search history cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchProducts,
  getSuggestions,
  getSearchHistory,
  clearSearchHistory
};
