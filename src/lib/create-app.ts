import { OpenAPIHono, type Hook } from "@hono/zod-openapi";
import type { AppBindings } from "./types.js";
import serveEmojiFavicon from "@/middleware/server-emoji-favicon.js";
import { pinoLogger } from "./pino-logger.js";
import notFound from "@/middleware/not-found.js";
import onError from "@/middleware/on-error.js";
import { UNPROCESSABLE_ENTITY } from "./http-status-code.js";

export function createRouter() {
  const router = new OpenAPIHono<AppBindings>({
    strict: false,
  });

  return router;
}

const defaultHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    return c.json(
      {
        success: result.success,
        error: result.error,
      },
      UNPROCESSABLE_ENTITY
    );
  }
};

export default function createApp() {
  const app = new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });

  app.use(serveEmojiFavicon("😀"));
  app.use(pinoLogger());
  app.notFound(notFound);
  app.onError(onError);

  return app;
}
