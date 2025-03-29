import { createRouter } from '@/lib/create-app.js';
import * as handlers from '@/routes/v1/catalogue/catalogue.handler.js';
import * as routes from '@/routes/v1/catalogue/catalogue.routes.js';

const router = createRouter();

router.openapi(routes.createCatalogueRoute, handlers.createCatalogue);
router.openapi(routes.getCataloguesRoute, handlers.getCatalogues);
router.openapi(routes.createCatalogueItemRoute, handlers.createCatalogueItem);
router.openapi(routes.allItemsRoute, handlers.allItems);
router.openapi(routes.bulkUpdatePricesRoute, handlers.bulkUpdatePrices);
router.openapi(routes.bulkTransferItemsRoute, handlers.bulkTransferItems);
router.openapi(routes.bulkDeleteItemsRoute, handlers.bulkDeleteItems);
router.openapi(routes.updateCatalogueRoute, handlers.updateCatalogue);
router.openapi(routes.deleteCatalogueRoute, handlers.deleteCatalogue);
router.openapi(routes.updateCatalogueItemRoute, handlers.updateCatalogueItem);
router.openapi(routes.deleteCatalogueItemRoute, handlers.deleteCatalogueItem);

export default router;
