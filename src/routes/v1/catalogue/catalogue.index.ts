import { createRouter } from '@/lib/create-app.js';
import * as handlers from '@/routes/v1/catalogue/catalogue.handler.js';
import * as routes from '@/routes/v1/catalogue/catalogue.routes.js';

const router = createRouter();

router.openapi(routes.createCatalogueRoute, handlers.createCatalogue);
router.openapi(routes.getCataloguesRoute, handlers.getCatalogues);
router.openapi(routes.createCatalogueItemRoute, handlers.createCatalogueItem);

export default router;
