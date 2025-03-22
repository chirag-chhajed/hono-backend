import type { AppOpenAPI } from "@/lib/types.js";
import { apiReference } from "@scalar/hono-api-reference";

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.1.1",
    info: {
      version: "1.0.0",
      title: "Tasks API",
    },
  });

  app.get(
    "/reference",
    apiReference({
      theme: "kepler",
      layout: "classic",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
      // @ts-ignore
      spec: {
        url: "/doc",
      },
    })
  );
}
