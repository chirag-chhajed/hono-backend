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
  path: "/catalogue",
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
  path: "/catalogue",
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

export const createCatalogueItemRoute = createRoute({
  method: "post",
  tags: ["Catalogue"],
  path: "/catalogue/{catalogueId}",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z
            .record(
              z.string().min(1),
              z
                .instanceof(File, { message: "Please upload a file." })
                .refine((f) => f.size <= 5 * 1024 * 1024, {
                  message: "Max 5 MB upload size.",
                })
                .refine((f) => f.type.includes("image/"), {
                  message: "Only images are allowed",
                })
            )
            .refine((files) => Object.keys(files).length <= 1, {
              message: "Maximum 1 file allowed",
            })
            .refine((files) => Object.keys(files).length >= 1, {
              message: "Minimum 1 file required",
            }),
        },
      },
    },
    query: z.object({
      name: z.string().min(1).max(100),
      description: z.string().min(1).max(500).optional(),
      price: z.coerce
        .number({ message: "Enter a valid price" })
        .positive("Price must be greater than 0")
        .multipleOf(0.01, "Price can only have up to 2 decimal places")
        .min(0.01, "Minimum price is 0.01"),
    }),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Catalogue item created successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Catalogue not found"
    ),
  },
  middlewares: [
    authenticate,
    requireOrganization,
    requirePermission("create:catalogue"),
  ] as const,
});

export const getCatalogueItems = createRoute({
  method: "get",
  tags: ["Catalogue"],
  path: "/catalogue/{catalogueId}",
  request: {
    query: getCataloguesSchema.extend({
      priceSort: z.enum(["asc", "desc"]).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        items: z.array(z.object({})),
        nextCursor: z.string().nullable(),
      }),
      "Catalogue items retrieved successfully"
    ),
  },
  middlewares: [authenticate, requireOrganization] as const,
});

export type CreateCatalogueRoute = typeof createCatalogueRoute;
export type GetCataloguesRoute = typeof getCataloguesRoute;
export type CreateCatalogueItemRoute = typeof createCatalogueItemRoute;
export type GetCatalogueItemsRoute = typeof getCatalogueItems;
