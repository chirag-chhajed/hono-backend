import { createRouter } from "@/lib/create-app.js";
import * as routes from "@/routes/v1/invitation/invitation.routes.js";
import * as handlers from "@/routes/v1/invitation/invitation.handler.js";

const router = createRouter();

router.openapi(routes.createInvitation, handlers.createInvitation);
router.openapi(routes.getInvitations, handlers.getInvitations);

export default router;
