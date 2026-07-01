const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const serverless = require("serverless-http");

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.PORT = process.env.PRODUCT_PORT || 5001;
process.env.MONGO_URI = process.env.PRODUCT_MONGO_URI;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/products', productRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'product-service' });
});

const PORT = 5001;

// app.listen(PORT, () => {
//   console.log(`Product service running on port ${PORT}`);
// });

// module.exports = app;

module.exports.handler = serverless(app);