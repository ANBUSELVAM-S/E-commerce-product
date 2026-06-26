const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

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