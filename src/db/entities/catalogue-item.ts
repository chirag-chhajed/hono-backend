import {Decimal} from 'decimal.js';
import { Entity } from 'electrodb';
import { ulid } from 'ulid';

import { dynamoClient, TABLE_NAME } from '@/db/client.js';

function formatPriceForSort(price: number): string {
  return new Decimal(price).mul(100).toFixed(0).padStart(12, '0');
}

const CatalogueItemEntity = new Entity(
  {
    model: {
      entity: 'catalogueItem',
      version: '1',
      service: 'app',
    },
    attributes: {
      itemId: { type: 'string', required: true, default: () => ulid() },
      catalogueId: { type: 'string', required: true },
      orgId: { type: 'string', required: true },
      name: { type: 'string', required: true },
      description: { type: 'string' },
      price: { type: 'number', required: true },
      priceSortKey: {
  type: "string",
  required: true,
  hidden: true,
  watch: ["price"],
  set: (_, { price }:{price:number}) => {
    return formatPriceForSort(price);
  },
  default: () => formatPriceForSort(0),
},
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
      deletedAt: { type: 'number',required:false },
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
          composite: ['itemId'],
        },
      },
      byPrice: {
        index: 'gsi1',
        pk: { field: 'gsi1pk', composite: ['catalogueId'] },
        sk: {
          field: 'gsi1sk',
          composite: ['priceSortKey'],
        },
      },
      byOrganization: {
        index: 'gsi2',
        pk: { field: 'gsi2pk', composite: ['orgId'] },
        sk: { field: 'gsi2sk', composite: ['itemId'] },
      },
      byOrganizationAndPrice: {
        index: 'gsi3',
        pk: { field: 'gsi3pk', composite: ['orgId'] },
        sk: { field: 'gsi3sk', composite: ['priceSortKey'] },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  },
);

export { CatalogueItemEntity };
