import { createRouter } from "@/lib/create-app.js";
import * as handlers from "./tasks.handler.js";
import * as routes from "./tasks.routes.js";

const router = createRouter();

router.openapi(routes.list, handlers.list);

export default router;
