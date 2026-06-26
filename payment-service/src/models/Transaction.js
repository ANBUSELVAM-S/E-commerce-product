const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
{
    transactionId: {
        type: String,
        unique: true
    },

    orderId: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    method: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'cod'],
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },

    paidAt: Date
},
{
    timestamps: true
}
);

transactionSchema.pre('save', function(next) {

    if (!this.transactionId) {
        this.transactionId = 'TXN-' + Date.now();
    }

    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);