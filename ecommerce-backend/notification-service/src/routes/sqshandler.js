const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION
});

const dynamoDB = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {

    console.log("Lambda Started");

    for (const record of event.Records) {

        try {

            console.log("Body:", record.body);

            // Parse SNS Envelope
            const snsMessage = JSON.parse(record.body);

            console.log("SNS Message:", snsMessage);

            const message = snsMessage.Message;

            console.log("Email Text:", message);

            // Extract values from plain text
            const transactionId =
                message.match(/Transaction ID\s*:\s*(.+)/)?.[1]?.trim() || "";

            const orderId =
                message.match(/Order ID\s*:\s*(.+)/)?.[1]?.trim() || "";

            const amount =
                message.match(/Amount\s*:\s*₹?(.+)/)?.[1]?.trim() || "";

            const status =
                message.match(/Payment Status\s*:\s*(.+)/)?.[1]?.trim() || "";

            console.log({
                transactionId,
                orderId,
                amount,
                status
            });

            await dynamoDB.send(
                new PutCommand({
                    TableName: process.env.NOTIFICATION_TABLE,
                    Item: {
                        notificationId: randomUUID(),

                        // Your email message doesn't contain userId
                        userId: randomUUID(),

                        transactionId,
                        orderId,
                        amount,
                        status,

                        title: "Payment Successful",

                        message: `Your payment for Order ${orderId} has been completed successfully.`,

                        type: "payment",

                        isRead: false,

                        createdAt: new Date().toISOString()
                    }
                })
            );

            console.log("Notification stored successfully");

        } catch (err) {

            console.error("Processing Error:", err);

            throw err;
        }
    }

    return {
        statusCode: 200,
        body: "Success"
    };
};