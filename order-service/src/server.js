const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.PORT = process.env.ORDER_PORT || 5003;
process.env.MONGO_URI = process.env.ORDER_MONGO_URI;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/orders', orderRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});

module.exports = app;
