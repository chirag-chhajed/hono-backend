import { Entity } from 'electrodb'
import { ulid } from 'ulid'

import { dynamoClient, TABLE_NAME } from '@/db/client.js'

// Define the User entity
export const UserEntity = new Entity(
  {
    model: {
      entity: 'user',
      version: '1',
      service: 'app',
    },
    attributes: {
      userId: { type: 'string', required: true, default: () => ulid() },
      email: { type: 'string', required: true },
      name: { type: 'string', required: true },
      createdAt: {
        type: 'number',
        required: true,
        default: () => Date.now(),
        readOnly: true,
        set: () => Date.now(),
      },
      updatedAt: {
        type: 'number',
        required: true,
        default: () => Date.now(),
        watch: '*',
        set: () => Date.now(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'pk',
          composite: ['userId'],
        },
        sk: {
          field: 'sk',
          composite: ['userId'],
        },
      },
      byEmail: {
        index: 'gsi1',
        pk: {
          field: 'gsi1pk',
          composite: ['email'],
        },
        sk: {
          field: 'gsi1sk',
          composite: ['userId'],
        },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  },
)
