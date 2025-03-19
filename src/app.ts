import { config } from "dotenv";
import { env } from "@/env.js";
import { expand } from "dotenv-expand";

import createApp from "@/lib/create-app.js";
import configureOpenAPI from "./lib/configure-open-api.js";
import indexRoute from "@/routes/index.route.js";
import tasksRoute from "@/routes/tasks/tasks.index.js";

expand(config());

const app = createApp();

const routes = [indexRoute, tasksRoute];

configureOpenAPI(app);

for (const route of routes) {
  app.route("/", route);
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
