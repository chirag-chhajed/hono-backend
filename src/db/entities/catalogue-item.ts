import { Entity } from 'electrodb';
import { nanoid } from 'nanoid';

import { dynamoClient, TABLE_NAME } from '@/db/client.js';

const CatalogueItemEntity = new Entity(
  {
    model: {
      entity: 'catalogueItem',
      version: '1',
      service: 'app',
    },
    attributes: {
      itemId: { type: 'string', required: true, default: () => nanoid(32) },
      catalogueId: { type: 'string', required: true },
      orgId: { type: 'string', required: true },
      name: { type: 'string', required: true },
      description: { type: 'string' },
      price: { type: 'number', required: true },
      metadata: { type: 'any' }, // JSON object
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
      deletedAt: { type: 'number' },
      image: {
        type: 'map',
        required: true,
        properties: {
          imageUrl: { type: 'string', required: true },
          blurhash: { type: 'string' },
          uploadedAt: { type: 'number', default: () => Date.now() },
        },
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'pk',
          composite: ['catalogueId'],
        },
        sk: {
          field: 'sk',
          composite: ['createdAt', 'itemId'],
        },
      },
      byPrice: {
        index: 'gsi1',
        pk: { field: 'gsi1pk', composite: ['catalogueId'] },
        sk: {
          field: 'gsi1sk',
          composite: ['price', 'createdAt'],
        },
      },
      byOrganization: {
        index: 'gsi2',
        pk: { field: 'gsi2pk', composite: ['orgId'] },
        sk: { field: 'gsi2sk', composite: ['createdAt'] },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  },
);

export { CatalogueItemEntity };
