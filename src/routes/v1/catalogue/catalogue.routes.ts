import { createRoute, z } from '@hono/zod-openapi';

import * as HttpStatusCodes from '@/lib/http-status-code.js';
import { jsonContent } from '@/lib/openapi/helpers/json-content.js';
import {
  authenticate,
  requireOrganization,
} from '@/middleware/authenticate.js';
import { requirePermission } from '@/middleware/require-permission.js';

const createCatalogueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createCatalogueRoute = createRoute({
  method: 'post',
  tags: ['Catalogue'],
  path: '/catalogue',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCatalogueSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        catalogueId: z.string(),
        orgId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        createdBy: z.string(),
        createdAt: z.number(),
        updatedAt: z.number(),
      }),
      'Catalogue created successfully',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('create:catalogue'),
  ] as const,
});

const getCataloguesSchema = z.object({
  cursor: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const getCataloguesRoute = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue',
  security: [{ bearerAuth: [] }],
  request: {
    query: getCataloguesSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(
          z.object({
            catalogueId: z.string(),
            orgId: z.string(),
            name: z.string(),
            description: z.string().optional(),
            createdBy: z.string(),
            createdAt: z.number(),
            updatedAt: z.number(),
          }),
        ),
        nextCursor: z.string().nullable(),
      }),
      'List of catalogues retrieved successfully',
    ),
  },
  middlewares: [authenticate, requireOrganization] as const,
});

export const createCatalogueItemRoute = createRoute({
  method: 'post',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z
            .record(
              z.string().min(1),
              z
                .instanceof(File, { message: 'Please upload a file.' })
                .refine(f => f.size <= 5 * 1024 * 1024, {
                  message: 'Max 5 MB upload size.',
                })
                .refine(f => f.type.includes('image/'), {
                  message: 'Only images are allowed',
                }),
            )
            .refine(files => Object.keys(files).length <= 1, {
              message: 'Maximum 1 file allowed',
            })
            .refine(files => Object.keys(files).length >= 1, {
              message: 'Minimum 1 file required',
            }),
        },
      },
    },
    query: z.object({
      name: z.string().min(1).max(100),
      description: z.string().min(1).max(500).optional(),
      price: z.coerce
        .number({ message: 'Enter a valid price' })
        .positive('Price must be greater than 0')
        .multipleOf(0.01, 'Price can only have up to 2 decimal places')
        .min(0.01, 'Minimum price is 0.01'),
    }),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue item created successfully',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue not found',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('create:catalogue'),
  ] as const,
});

export const getCatalogueItems = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}',
  security: [{ bearerAuth: [] }],
  request: {
    query: getCataloguesSchema.extend({
      priceSort: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(z.object({})),
        nextCursor: z.string().nullable(),
      }),
      'Catalogue items retrieved successfully',
    ),
  },
  middlewares: [authenticate, requireOrganization] as const,
});

export const allItemsRoute = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue/all',
  security: [{ bearerAuth: [] }],
  request: {
    query: getCataloguesSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(z.object({})),
        nextCursor: z.string().nullable(),
      }),
      'All items retrieved successfully',
    ),
  },
  middlewares: [authenticate, requireOrganization] as const,
});

export const bulkUpdatePricesRoute = createRoute({
  method: 'post',
  tags: ['Catalogue'],
  path: '/catalogue/bulk-update-prices',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              catalogueId: z.string(),
              itemId: z.string(),
              createdAt: z.number(),
            })).min(1),
            operation: z.enum(['clone', 'update']),
            value: z.coerce.number({ message: 'Enter a valid number' }).positive('Value must be greater than 0').multipleOf(0.01, 'Value can only have up to 2 decimal places'),
            mode: z.enum(['absolute', 'percentage']),
            direction: z.enum(['increase', 'decrease']),
            newCatalogueId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Prices updated successfully',
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Invalid items',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('update:catalogue'),
  ] as const,
});

export const bulkTransferItemsRoute = createRoute({
  method: 'post',
  tags: ['Catalogue'],
  path: '/catalogue/bulk-transfer-items',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              catalogueId: z.string(),
              itemId: z.string(),
              createdAt: z.number(),
            })).min(1),
            newCatalogueId: z.string().optional(),
            operation: z.enum(['clone', 'transfer']),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Items transferred successfully',
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Invalid items',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('update:catalogue'),
  ] as const,
});

export const bulkDeleteItemsRoute = createRoute({
  method: 'delete',
  tags: ['Catalogue'],
  path: '/catalogue/bulk-delete-items',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              catalogueId: z.string(),
              itemId: z.string(),
              createdAt: z.number(),
            })).min(1),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Items deleted successfully',
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Invalid items',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('delete:catalogue'),
  ] as const,
});

export const updateCatalogueRoute = createRoute({
  method: 'put',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(100),
            description: z.string().min(1).max(500).optional(),
            createdAt: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue updated successfully',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('update:catalogue'),
  ] as const,
});

export const deleteCatalogueRoute = createRoute({
  method: 'delete',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            createdAt: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: 'Catalogue deleted successfully',
    },
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue is not empty',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('delete:catalogue'),
  ] as const,
});

export const updateCatalogueItemRoute = createRoute({
  method: 'put',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}/{itemId}',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(100),
            description: z.string().min(1).max(500).optional(),
            price: z.coerce.number({ message: 'Enter a valid number' }).positive('Price must be greater than 0').multipleOf(0.01, 'Price can only have up to 2 decimal places'),
            createdAt: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue item updated successfully',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue item not found',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('update:catalogue'),
  ] as const,
});

export const deleteCatalogueItemRoute = createRoute({
  method: 'delete',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}/{itemId}',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            createdAt: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: 'Catalogue item deleted successfully',
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue item not found',
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission('delete:catalogue'),
  ] as const,
});

export type CreateCatalogueRoute = typeof createCatalogueRoute;
export type GetCataloguesRoute = typeof getCataloguesRoute;
export type CreateCatalogueItemRoute = typeof createCatalogueItemRoute;
export type GetCatalogueItemsRoute = typeof getCatalogueItems;
export type AllItemsRoute = typeof allItemsRoute;
export type BulkUpdatePricesRoute = typeof bulkUpdatePricesRoute;
export type BulkTransferItemsRoute = typeof bulkTransferItemsRoute;
export type BulkDeleteItemsRoute = typeof bulkDeleteItemsRoute;
export type UpdateCatalogueRoute = typeof updateCatalogueRoute;
export type DeleteCatalogueRoute = typeof deleteCatalogueRoute;
export type UpdateCatalogueItemRoute = typeof updateCatalogueItemRoute;
export type DeleteCatalogueItemRoute = typeof deleteCatalogueItemRoute;
