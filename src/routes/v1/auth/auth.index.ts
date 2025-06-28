import { createRouter } from '@/lib/create-app.js'
import * as handlers from '@/routes/v1/auth/auth.handler.js'
import * as routes from '@/routes/v1/auth/auth.routes.js'

const router = createRouter()

router.openapi(routes.login, handlers.login)
router.openapi(routes.refresh, handlers.refresh)
router.openapi(routes.logout, handlers.logout)

export default router
