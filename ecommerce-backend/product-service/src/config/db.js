const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION
});

const dynamoDB = DynamoDBDocumentClient.from(client);

console.log(`DynamoDB Client Initialized (${process.env.AWS_REGION})`);

module.exports = dynamoDB;