import { env } from "@/env.js";

import configureOpenAPI from "@/lib/configure-open-api.js";
import createApp from "@/lib/create-app.js";
import indexRoute from "@/routes/index.route.js";
import tasksRoute from "@/routes/tasks/tasks.index.js";
import authRoute from "@/routes/auth/auth.index.js";
import organisationRoute from "@/routes/organisation/organisation.index.js";

const app = createApp();

const routes = [indexRoute, tasksRoute, authRoute, organisationRoute];

configureOpenAPI(app);

for (const route of routes) {
  app.route("/api", route);
}

app.get("/", (c) => {
  c.var.logger.info(env.PORT);
  return c.text("Hello Hono!");
});

app.get("/error", (c) => {
  c.status(422);
  c.var.logger.debug("Hello");
  throw new Error("Oh no!");
});

export default app;
