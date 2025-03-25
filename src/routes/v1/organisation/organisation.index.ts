import { createRouter } from "@/lib/create-app.js";
import * as handlers from "@/routes/v1/organisation/organisation.handler.js";
import * as routes from "@/routes/v1/organisation/organisation.routes.js";

const router = createRouter();

router.openapi(routes.getOrganisations, handlers.getOrganisations);
router.openapi(routes.createOrganisation, handlers.createOrganisation);
router.openapi(
  routes.removeUserFromOrganisation,
  handlers.removeUserFromOrganisation
);

export default router;
