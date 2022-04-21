const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DEFAULT_DYNAMODB_REGION } = require('/opt/config');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || DEFAULT_DYNAMODB_REGION,
});

const documentClient = DynamoDBDocument.from(client);

module.exports = {
  documentClient,
};
