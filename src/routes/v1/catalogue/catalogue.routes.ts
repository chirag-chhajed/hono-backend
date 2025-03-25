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

export const fileUploadRoute = createRoute({
  method: "post",
  path: "/catalogue/file-upload",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z
            .record(
              z.string().min(1),
              z
                .instanceof(File, { message: "Please upload a file." })
                .refine(
                  (f) => f.size <= 5 * 1024 * 1024,
                  "Max 5 MB upload size."
                )
                .refine((f) => f.type.includes("image"), {
                  message: "Only images are allowed",
                })
            )
            .refine(
              (files) => Object.keys(files).length <= 5,
              "Maximum 5 files allowed"
            )
            .refine(
              (files) => Object.keys(files).length >= 1,
              "Minimum 1 file required"
            ),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "File uploaded successfully"
    ),
  },
});

export type CreateCatalogueRoute = typeof createCatalogueRoute;
export type GetCataloguesRoute = typeof getCataloguesRoute;
export type FileUploadRoute = typeof fileUploadRoute;
