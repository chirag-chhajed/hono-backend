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
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('create:catalogue'),
  ] as const,
  security: [{ Bearer: [] }],
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
});

const getCataloguesSchema = z.object({
  cursor: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const getCataloguesRoute = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue',
  security: [{ Bearer: [] }],
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
            deletedAt: z.number().optional(),
            images: z.array(z.object({
              imageUrl: z.string(),
              blurhash: z.string().optional(),
              imageId: z.string(),
              catalogueId: z.string(),
              itemId: z.string(),
            })),
            
          }),
        ),
        nextCursor: z.string().nullable(),
      }),
      'List of catalogues retrieved successfully',
    ),
  },
  middleware: [authenticate, requireOrganization] as const,
});

export const createCatalogueItemRoute = createRoute({
  method: 'post',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}',
  security: [{ Bearer: [] }],
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
      description: z.string().max(500).optional().nullable(),
      price: z.coerce
        .number({ message: 'Enter a valid price' })
        .positive('Price must be greater than 0')
        .multipleOf(0.01, 'Price can only have up to 2 decimal places')
        .min(0.01, 'Minimum price is 0.01'),
    }),
    params: z.object({
      catalogueId: z.string(),
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
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('create:catalogue'),
  ] as const,
});

export const getCatalogueItems = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}',
  security: [{ Bearer: [] }],
  request: {
    query: getCataloguesSchema.extend({
      priceSort: z.enum(['asc', 'desc']).optional(),
    }),
    params: z.object({
      catalogueId: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(z.object({
          itemId: z.string(),
          catalogueId: z.string(),
          orgId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          metadata: z.any().optional(),
          createdAt: z.number(),
          updatedAt: z.number(),
          deletedAt: z.number().optional(),
          image: z.object({
            imageUrl: z.string(),
            blurhash: z.string().optional(),
            uploadedAt: z.number().optional(),
          }),
          
        })),
        nextCursor: z.string().nullable(),
      }),
      'Catalogue items retrieved successfully',
    ),
  },
  middleware: [authenticate, requireOrganization] as const,
});

export const allItemsRoute = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue/all',
  security: [{ Bearer: [] }],
  request: {
    query: getCataloguesSchema.extend({
      priceSort: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(z.object({
          itemId: z.string(),
          catalogueId: z.string(),
          orgId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          metadata: z.any().optional(),
          createdAt: z.number(),
          updatedAt: z.number(),
          deletedAt: z.number().optional(),
          image: z.object({
            imageUrl: z.string(),
            blurhash: z.string().optional(),
            uploadedAt: z.number().optional(),
          }),
        })),
        nextCursor: z.string().nullable(),
      }),
      'All items retrieved successfully',
    ),
  },
  middleware: [authenticate, requireOrganization] as const,
});

export const bulkUpdatePricesRoute = createRoute({
  method: 'post',
  tags: ['Catalogue'],
  path: '/catalogue/bulk-update-prices',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              catalogueId: z.string(),
              itemId: z.string(),
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
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('update:catalogue'),
  ] as const,
});

export const bulkTransferItemsRoute = createRoute({
  method: 'post',
  tags: ['Catalogue'],
  path: '/catalogue/bulk-transfer-items',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              catalogueId: z.string(),
              itemId: z.string(),
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
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('update:catalogue'),
  ] as const,
});

export const bulkDeleteItemsRoute = createRoute({
  method: 'delete',
  tags: ['Catalogue'],
  path: '/catalogue/bulk-delete-items',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({
              catalogueId: z.string(),
              itemId: z.string(),
            })).min(1),
          }),
        },
      },
      params: z.object({
        catalogueId: z.string(),
      }),
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
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('delete:catalogue'),
  ] as const,
});

export const updateCatalogueRoute = createRoute({
  method: 'put',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().trim().min(1).max(100),
            description: z.string().trim().max(500).optional(),
          }),
        },
      },
    },
    params: z.object({
      catalogueId: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue updated successfully',
    ),
  },
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('update:catalogue'),
  ] as const,
});

export const deleteCatalogueRoute = createRoute({
  method: 'delete',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      catalogueId: z.string(),
    }),
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
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('delete:catalogue'),
  ] as const,
});

export const getCatalogueItemRoute = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}/{itemId}',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      catalogueId: z.string().ulid(),
      itemId: z.string().ulid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
          itemId: z.string(),
          catalogueId: z.string(),
          orgId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          metadata: z.any().optional(),
          createdAt: z.number(),
          updatedAt: z.number(),
          deletedAt: z.number().optional(),
          image: z.object({
            imageUrl: z.string(),
            blurhash: z.string().optional(),
            uploadedAt: z.number().optional(),
          }),
        }),
      'Catalogue item retrieved successfully',
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Catalogue item not found',
    )
  },
  middleware: [authenticate, requireOrganization] as const,
});
export const updateCatalogueItemRoute = createRoute({
  method: 'put',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}/{itemId}',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().trim().max(100),
            description: z.string().trim().max(500).optional(),
            price: z.coerce.number({ message: 'Enter a valid number' }).positive('Price must be greater than 0').multipleOf(0.01, 'Price can only have up to 2 decimal places').min(0.01, 'Minimum price is 0.01'),
          }),
        },
      },
    },
    params: z.object({
      catalogueId: z.string(),
      itemId: z.string(),
    }),
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
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('update:catalogue'),
  ] as const,
});

export const deleteCatalogueItemRoute = createRoute({
  method: 'delete',
  tags: ['Catalogue'],
  path: '/catalogue/{catalogueId}/{itemId}',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      catalogueId: z.string(),
      itemId: z.string(),
    }),
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
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('delete:catalogue'),
  ] as const,
});

export const searchCataloguesRoute = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue/search',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      search: z.string().min(1),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(z.object({
          catalogueId: z.string(),
          orgId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          createdBy: z.string(),
          createdAt: z.number(),
          updatedAt: z.number(),
          deletedAt: z.number().optional(),
          images: z.array(z.object({
            imageUrl: z.string(),
            blurhash: z.string().optional(),
            imageId: z.string(),
            catalogueId: z.string(),
            itemId: z.string(),
          })),
          
        })),

      }),
      'Catalogues searched successfully',
    ),
  },
  middleware: [authenticate, requireOrganization] as const,
});

export const searchAllCatalogueItemsRoute = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue/search-items',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      search: z.string().min(1),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(z.object({
          itemId: z.string(),
          catalogueId: z.string(),
          orgId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          metadata: z.any().optional(),
          createdAt: z.number(),
          updatedAt: z.number(),
          deletedAt: z.number().optional(),
          image: z.object({
            imageUrl: z.string(),
            blurhash: z.string().optional(),
            uploadedAt: z.number().optional(),
          }),
          
        })),
      }),
      'Catalogues searched successfully',
    ),
  },
  middleware: [authenticate, requireOrganization] as const,
});

export const searchCatalogueItemsRoute = createRoute({
  method: 'get',
  tags: ['Catalogue'],
  path: '/catalogue/search-items/{catalogueId}',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      search: z.string().min(1),
    }),
    params: z.object({
      catalogueId: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(z.object({
          itemId: z.string(),
          catalogueId: z.string(),
          orgId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          metadata: z.any().optional(),
          createdAt: z.number(),
          updatedAt: z.number(),
          deletedAt: z.number().optional(),
          image: z.object({
            imageUrl: z.string(),
            blurhash: z.string().optional(),
            uploadedAt: z.number().optional(),
          }),
          
        })),
      }),
      'Catalogues searched successfully',
    ),
  },
  middleware: [authenticate, requireOrganization] as const,
});

export type CreateCatalogueRoute = typeof createCatalogueRoute;
export type GetCataloguesRoute = typeof getCataloguesRoute;
export type CreateCatalogueItemRoute = typeof createCatalogueItemRoute;
export type GetCatalogueItemsRoute = typeof getCatalogueItems;
export type AllItemsRoute = typeof allItemsRoute;
export type BulkUpdatePricesRoute = typeof bulkUpdatePricesRoute;
export type BulkTransferItemsRoute = typeof bulkTransferItemsRoute;
export type BulkDeleteItemsRoute = typeof bulkDeleteItemsRoute;
export type GetCatalogueItemRoute = typeof getCatalogueItemRoute;
export type UpdateCatalogueRoute = typeof updateCatalogueRoute;
export type DeleteCatalogueRoute = typeof deleteCatalogueRoute;
export type UpdateCatalogueItemRoute = typeof updateCatalogueItemRoute;
export type DeleteCatalogueItemRoute = typeof deleteCatalogueItemRoute;
export type SearchCataloguesRoute = typeof searchCataloguesRoute;
export type SearchAllCatalogueItemsRoute = typeof searchAllCatalogueItemsRoute;
export type SearchCatalogueItemsRoute = typeof searchCatalogueItemsRoute;
