import { createRoute, z } from "@hono/zod-openapi";

import * as HttpStatusCodes from "@/lib/http-status-code.js";
import { jsonContent } from "@/lib/openapi/helpers/json-content.js";
import {
  authenticate,
  requireOrganization,
} from "@/middleware/authenticate.js";
import { requirePermission } from "@/middleware/require-permission.js";

export const createInvitation = createRoute({
  method: "post",
  tags: ["Invitation"],
  path: "/invitation",
  security: [{ Bearer: [] }],
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission("invite:user"),
  ] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              role: z.enum(["admin", "editor", "viewer"]),
            })
            .strict(),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z
        .object({
          inviteCode: z.string().length(10),
        })
        .openapi({
          example: {
            inviteCode: "1234567890",
          },
        }),
      "Invitation code",
    ),
  },
});

export const getInvitations = createRoute({
  method: "get",
  tags: ["Invitation"],
  path: "/invitation",
  security: [{ Bearer: [] }],
  middleware: [
    authenticate,
    requireOrganization,
    requirePermission("invite:user"),
  ] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(
        z.object({
          code: z.string().length(10),
          role: z.string(),
          createdBy: z.string(),
          createdAt: z.number(),
          expiresAt: z.number(),
          usedBy: z.string().optional(),
          usedAt: z.number().optional(),
        }),
      ),
      "Invitation details",
    ),
  },
});

export const acceptInvitation = createRoute({
  method: "post",
  tags: ["Invitation"],
  path: "/invitation/accept",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            code: z.string().length(10),
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
      "Invitation accepted",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Already accepted",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Invitation not found",
    ),
  },
  middleware: [authenticate],
});

export type CreateInvitationRoute = typeof createInvitation;
export type GetInvitationsRoute = typeof getInvitations;
export type AcceptInvitationRoute = typeof acceptInvitation;
