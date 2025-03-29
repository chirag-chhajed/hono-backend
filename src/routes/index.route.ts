import { createRoute, z } from '@hono/zod-openapi';

import { createRouter } from '@/lib/create-app.js';
import * as HttpStatusCodes from '@/lib/http-status-code.js';
import { jsonContent } from '@/lib/openapi/helpers/json-content.js';

const router = createRouter().openapi(
  createRoute({
    tags: ['Index'],
    method: 'get',
    path: '/',
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
        }),
        'Hello World',
      ),
    },
  }),
  (c) => {
    return c.json(
      {
        message: 'Hello World',
      },
      HttpStatusCodes.OK,
    );
  },
);

export default router;
