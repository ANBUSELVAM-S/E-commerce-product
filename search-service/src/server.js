const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.PORT = process.env.SEARCH_PORT || 5005;
process.env.MONGO_URI = process.env.SEARCH_MONGO_URI;

const connectDB = require('./config/db');
const searchRoutes = require('./routes/searchRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/search', searchRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'search-service' });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Search service running on port ${PORT}`);
});

module.exports = app;
