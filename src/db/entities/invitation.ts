import { Entity } from 'electrodb';
import { ulid } from 'ulid';

import { dynamoClient, TABLE_NAME } from '@/db/client.js';

const InvitationEntity = new Entity(
  {
    model: {
      entity: 'invitation',
      version: '1',
      service: 'app',
    },
    attributes: {
      invitationId: {
        type: 'string',
        required: true,
        default: () => ulid(),
      },
      orgId: { type: 'string', required: true },
      code: { type: 'string', required: true },
      createdBy: { type: 'string', required: true }, // userId (admin)
      expiresAt: { type: 'number', required: true },
      usedBy: { type: 'string' }, // userId (optional)
      usedAt: { type: 'number' },
      role: { type: ['admin', 'editor', 'viewer'] as const, required: true }, // timestamp (optional)
      createdAt: {
        type: 'number',
        required: true,
        default: () => Date.now(),
        readOnly: true,
        set: () => Date.now(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'pk',
          composite: ['orgId'],
        },
        sk: {
          field: 'sk',
          composite: ['invitationId'],
        },
      },
      byCode: {
        index: 'gsi1',
        pk: {
          field: 'gsi1pk',
          composite: ['code'],
        },
        sk: {
          field: 'gsi1sk',
          composite: ['invitationId'],
        },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  },
);

export { InvitationEntity };
