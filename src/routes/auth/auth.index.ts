import { createRouter } from "@/lib/create-app.js";
import * as handlers from "@/routes/auth/auth.handler.js";
import * as routes from "@/routes/auth/auth.routes.js";

const router = createRouter();

router.openapi(routes.login, handlers.login);

export default router; 