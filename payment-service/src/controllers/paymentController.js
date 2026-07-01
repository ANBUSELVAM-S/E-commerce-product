const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = require("../config/db");

const {
    PutCommand,
    GetCommand,
    ScanCommand,
    UpdateCommand,
    DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.PAYMENT_TABLE;

const getOrderServiceUrl = () =>
    process.env.ORDER_SERVICE_URL || "http://localhost:5003";

// ----------------------------
// POST /api/payments/initiate
// ----------------------------

const initiatePayment = async (req, res) => {
    try {

        const { orderId, amount, method } = req.body;

        if (!orderId || amount == null || !method) {
            return res.status(400).json({
                message: "orderId amount and method required"
            });
        }

        const payment = {

            transactionId: uuidv4(),
            orderId,
            amount,
            method,
            status: "pending",
            paidAt: null,
            createdAt: new Date().toISOString()

        };

        await dynamoDB.send(new PutCommand({

            TableName: TABLE_NAME,
            Item: payment

        }));

        res.status(201).json(payment);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

// ----------------------------
// POST /api/payments/confirm
// ----------------------------

const confirmPayment = async (req, res) => {

    try {

        const { transactionId } = req.body;

        const data = await dynamoDB.send(new GetCommand({

            TableName: TABLE_NAME,
            Key: {
                transactionId
            }

        }));

        if (!data.Item)
            return res.status(404).json({
                message: "Payment not found"
            });

        await dynamoDB.send(new UpdateCommand({

            TableName: TABLE_NAME,

            Key: {
                transactionId
            },

            UpdateExpression:
                "set #s=:s, paidAt=:p",

            ExpressionAttributeNames: {

                "#s": "status"

            },

            ExpressionAttributeValues: {

                ":s": "success",
                ":p": new Date().toISOString()

            }

        }));

        try {

            await axios.patch(

                `${getOrderServiceUrl()}/api/orders/${data.Item.orderId}/pay`

            );

        } catch (e) {

            console.log(e.message);

        }

        res.json({

            message: "Payment confirmed"

        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// ----------------------------
// POST /api/payments/fail
// ----------------------------

const failPayment = async (req, res) => {

    try {

        const { transactionId } = req.body;

        await dynamoDB.send(new UpdateCommand({

            TableName: TABLE_NAME,

            Key: {

                transactionId

            },

            UpdateExpression: "set #s=:s",

            ExpressionAttributeNames: {

                "#s": "status"

            },

            ExpressionAttributeValues: {

                ":s": "failed"

            }

        }));

        res.json({

            message: "Payment Failed"

        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// ----------------------------
// GET order payments
// ----------------------------

const getTransactionsByOrderId = async (req, res) => {

    try {

        const data = await dynamoDB.send(new ScanCommand({

            TableName: TABLE_NAME

        }));

        const payments = data.Items.filter(

            item => item.orderId === req.params.orderId

        );

        res.json(payments);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

// ----------------------------
// POST
// ----------------------------

const createPayment = initiatePayment;

// ----------------------------
// GET ALL
// ----------------------------

const getAllPayments = async (req, res) => {

    try {

        const data = await dynamoDB.send(new ScanCommand({

            TableName: TABLE_NAME

        }));

        res.json(data.Items);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

// ----------------------------
// GET ONE
// ----------------------------

const getPaymentById = async (req, res) => {

    try {

        const data = await dynamoDB.send(new GetCommand({

            TableName: TABLE_NAME,

            Key: {

                transactionId: req.params.id

            }

        }));

        if (!data.Item)

            return res.status(404).json({

                message: "Payment not found"

            });

        res.json(data.Item);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

// ----------------------------
// UPDATE
// ----------------------------

const updatePayment = async (req, res) => {

    try {

        const body = req.body;

        let updateExp = "set ";

        const names = {};

        const values = {};

        Object.keys(body).forEach((key, index) => {

            updateExp += `#${key}= :${key}`;

            if (index !== Object.keys(body).length - 1)
                updateExp += ",";

            names[`#${key}`] = key;

            values[`:${key}`] = body[key];

        });

        await dynamoDB.send(new UpdateCommand({

            TableName: TABLE_NAME,

            Key: {

                transactionId: req.params.id

            },

            UpdateExpression: updateExp,

            ExpressionAttributeNames: names,

            ExpressionAttributeValues: values

        }));

        res.json({

            message: "Updated"

        });

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

// ----------------------------
// DELETE
// ----------------------------

const deletePayment = async (req, res) => {

    try {

        await dynamoDB.send(new DeleteCommand({

            TableName: TABLE_NAME,

            Key: {

                transactionId: req.params.id

            }

        }));

        res.json({

            message: "Deleted"

        });

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

module.exports = {

    initiatePayment,
    confirmPayment,
    failPayment,
    getTransactionsByOrderId,
    createPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment

};