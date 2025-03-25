import { createRouter } from "@/lib/create-app.js";
import * as routes from "@/routes/catalogue/catalogue.routes.js";
import * as handlers from "@/routes/catalogue/catalogue.handler.js";

const router = createRouter();

router.openapi(routes.createCatalogueRoute, handlers.createCatalogue);
router.openapi(routes.getCataloguesRoute, handlers.getCatalogues);

export default router;
