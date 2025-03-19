import app from "@/app.js";
import { env } from "@/env.js";
import { serve } from "@hono/node-server";

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
