import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "@/lib/openapi/helpers/json-content.js";
import {
  authenticate,
  requireOrganization,
} from "@/middleware/authenticate.js";
import { requirePermission } from "@/middleware/require-permission.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";

const createCatalogueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createCatalogueRoute = createRoute({
  method: "post",
  tags: ["Catalogue"],
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createCatalogueSchema,
        },
      },
    },
  },
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
      "Catalogue created successfully"
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission("create:catalogue"),
  ] as const,
});

const getCataloguesSchema = z.object({
  cursor: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const getCataloguesRoute = createRoute({
  method: "get",
  tags: ["Catalogue"],
  path: "/",
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
          })
        ),
        nextCursor: z.string().nullable(),
      }),
      "List of catalogues retrieved successfully"
    ),
  },
  middlewares: [authenticate, requireOrganization] as const,
});

export type CreateCatalogueRoute = typeof createCatalogueRoute;
export type GetCataloguesRoute = typeof getCataloguesRoute;
