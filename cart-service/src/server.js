const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cartRoutes = require('./routes/cartRoutes');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/cart', cartRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cart-service' });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Cart service running on port ${PORT}`);
});

module.exports = app;
