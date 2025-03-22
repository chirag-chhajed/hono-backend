import { UNPROCESSABLE_ENTITY } from "@/lib/http-status-code.js";
import { pinoLogger } from "@/lib/pino-logger.js";
import type { AppBindings } from "@/lib/types.js";
import notFound from "@/middleware/not-found.js";
import onError from "@/middleware/on-error.js";
import serveEmojiFavicon from "@/middleware/server-emoji-favicon.js";
import { type Hook, OpenAPIHono } from "@hono/zod-openapi";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
// @ts-ignore
import * as admin from '../../fir-authentication-41806-firebase-adminsdk-ocd3y-66d893d6b2.json'

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

const firebaseAdmin = initializeApp({
  
credential: cert({
  clientEmail:admin.default.client_email,
  privateKey:admin.default.private_key,
  projectId:admin.default.project_id
})
})

export const auth = getAuth(firebaseAdmin)
