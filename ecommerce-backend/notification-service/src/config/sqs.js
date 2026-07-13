const { SQSClient } = require("@aws-sdk/client-sqs");

module.exports = new SQSClient({
    region: process.env.AWS_REGION
});