import { createRoute, z } from '@hono/zod-openapi';

import * as HttpStatusCodes from '@/lib/http-status-code.js';
import { jsonContent } from '@/lib/openapi/helpers/json-content.js';
import {
  authenticate,
  requireOrganization,
} from '@/middleware/authenticate.js';
import { requirePermission } from '@/middleware/require-permission.js';

export const getOrganisations = createRoute({
  tags: ['Organisation'],
  path: '/organisation',
  method: 'get',
  security: [{ bearerAuth: [] }],
  middleware: [authenticate] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(
        z
          .object({
            orgId: z.string(),
            name: z.string(),
            description: z.string().optional(),
            role: z.string(),
          })
          .openapi({
            example: {
              orgId: 'rmtCk40CueaWfhQrzjYwr',
              name: 'Organisation 1',
              description: 'Organisation 1 description',
              role: 'admin',
            },
          }),
      ),
      'Organisation details',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Internal server error during organisation retrieval',
    ),
  },
});

export const createOrganisation = createRoute({
  tags: ['Organisation'],
  path: '/organisation',
  method: 'post',
  security: [{ bearerAuth: [] }],
  middleware: [authenticate] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z
              .string()
              .trim()
              .min(1, 'Name must be minimum of 1 character')
              .max(100, 'Name must be maximum of 100 characters'),
            description: z
              .string()
              .trim()
              .max(500, 'Description must be maximum of 500 characters')
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Organisation created successfully',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Internal server error during organisation creation',
    ),
  },
});

export const removeUserFromOrganisation = createRoute({
  tags: ['Organisation'],
  path: '/organisation/remove-user/{userId}',
  method: 'delete',
  security: [{ bearerAuth: [] }],
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission('remove:user'),
  ] as const,
  request: {
    params: z.object({
      userId: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: 'User removed from organisation successfully',
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Internal server error during user removal',
    ),
  },
});

export type GetOrganisationsRoute = typeof getOrganisations;
export type CreateOrganisationRoute = typeof createOrganisation;
export type RemoveUserFromOrganisationRoute = typeof removeUserFromOrganisation;
