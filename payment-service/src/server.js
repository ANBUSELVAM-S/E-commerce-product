const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.PORT = process.env.PAYMENT_PORT || 5004;
process.env.MONGO_URI = process.env.PAYMENT_MONGO_URI;

const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/payments', require('./routes/paymentRoutes'));

app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'payment-service'
    });
});

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
    console.log(`Payment Service Running On Port ${PORT}`);
});