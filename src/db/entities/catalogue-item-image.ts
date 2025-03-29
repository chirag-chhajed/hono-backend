import { Entity } from 'electrodb';
import { nanoid } from 'nanoid';

import { dynamoClient, TABLE_NAME } from '@/db/client.js';

const CatalogueItemImageEntity = new Entity(
  {
    model: {
      entity: 'catalogueItemImage',
      version: '1',
      service: 'app',
    },
    attributes: {
      imageId: { type: 'string', required: true, default: () => nanoid(32) },
      itemId: { type: 'string', required: true },
      catalogueId: { type: 'string', required: true },
      orgId: { type: 'string', required: true },
      imageUrl: { type: 'string', required: true },
      blurhash: { type: 'string' },
      createdAt: {
        type: 'number',
        required: true,
        default: () => Date.now(),
        readOnly: true,
      },
      deletedAt: { type: 'number' },
    },
    indexes: {
      primary: {
        pk: {
          field: 'pk',
          composite: ['itemId'],
        },
      },
      byCatalogueId: {
        index: 'gsi1',
        pk: {
          field: 'gsi1pk',
          composite: ['catalogueId'],
        },
        sk: {
          field: 'gsi1sk',
          composite: ['createdAt', 'imageId'],
        },
      },
    },
  },
  { client: dynamoClient, table: TABLE_NAME },
);

export { CatalogueItemImageEntity };
