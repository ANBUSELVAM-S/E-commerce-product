const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const serverless = require("serverless-http");


dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.PORT = process.env.INVENTORY_PORT || 5007;
process.env.MONGO_URI = process.env.INVENTORY_MONGO_URI;

const connectDB = require('./config/db');
const inventoryRoutes = require('./routes/inventoryRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/inventory', inventoryRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory-service' });
});

const PORT = process.env.PORT;

// app.listen(PORT, () => {
//   console.log(`Inventory service running on port ${PORT}`);
// });

// module.exports = app;

module.exports.handler = serverless(app);
