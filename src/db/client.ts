import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { env } from '@/env.js';

// Create the base DynamoDB client for local development
const client = new DynamoDBClient({
  region: env.MY_AWS_REGION,
  credentials: {
    accessKeyId: env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

// Create the document client
export const dynamoClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = 'app-data';
