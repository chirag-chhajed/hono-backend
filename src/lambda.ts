import { handle } from 'hono/aws-lambda'

import app from '@/app.js'
// for deploying on aws lambda
export const handler = handle(app)
