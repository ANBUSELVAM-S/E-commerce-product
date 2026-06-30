const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const cartRoutes = require('./routes/cartRoutes');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.PORT = process.env.CART_PORT || 5002;
process.env.MONGO_URI = process.env.CART_MONGO_URI;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/cart', cartRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cart-service' });
});

app.get('/test', (req, res) => {
  res.send('Server Working');
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Cart service running on port ${PORT}`);
});

module.exports = app;
