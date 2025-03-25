import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "@/lib/openapi/helpers/json-content.js";
import {
  authenticate,
  requireOrganization,
} from "@/middleware/authenticate.js";
import { requirePermission } from "@/middleware/require-permission.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";

export const createInvitation = createRoute({
  method: "post",
  tags: ["Invitation"],
  path: "/invitation",
  security: [{ bearerAuth: [] }],
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
      "Invitation code"
    ),
  },
});

export const getInvitations = createRoute({
  method: "get",
  tags: ["Invitation"],
  path: "/invitation",
  security: [{ bearerAuth: [] }],
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
        })
      ),
      "Invitation details"
    ),
  },
});

export type CreateInvitationRoute = typeof createInvitation;
export type GetInvitationsRoute = typeof getInvitations;
