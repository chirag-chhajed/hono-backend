import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Create the base DynamoDB client for local development
const client = new DynamoDBClient({
  region: 'us-west-2',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

// Create the document client
export const dynamoClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = 'app-data';
