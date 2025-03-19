import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import { jsonContent } from "@/lib/openapi/helpers/json-content.js";

export const list = createRoute({
  tags: ["Tasks"],
  path: "/tasks",
  method: "get",
  middleware: [
    async (c, next) => {
      c.var.logger.info("middleware");
      await next();
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(
        z.object({
          name: z.string(),
          done: z.boolean(),
        })
      ),
      "A list of tasks"
    ),
  },
});

export type ListRoute = typeof list;
