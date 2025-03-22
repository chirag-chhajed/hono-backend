import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import { jsonContent } from "@/lib/openapi/helpers/json-content.js";

export const login = createRoute({
  tags: ["Auth"],
  path: "/auth/login",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().trim().min(1),
            email: z.string().email().trim().min(1),
            idToken: z.string().trim().min(1),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        user: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
        }),
        token: z.string(),
      }),
      "Login response"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Authentication failed"
    ),
  },
});

export type LoginRoute = typeof login; 