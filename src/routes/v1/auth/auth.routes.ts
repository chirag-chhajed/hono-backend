import { createRoute, z } from '@hono/zod-openapi'

import * as HttpStatusCodes from '@/lib/http-status-code.js'
import { jsonContent } from '@/lib/openapi/helpers/json-content.js'

// Validation error schema
const ValidationErrorSchema = z.object({
  success: z.boolean(),
  errors: z.array(
    z.object({
      path: z.string(),
      message: z.string(),
    }),
  ),
})

// Firebase auth error schema
const FirebaseAuthErrorSchema = z.object({
  success: z.boolean(),
  code: z.string(),
  message: z.string(),
})

// Generic auth error schema
const AuthErrorSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

// Success response schema
const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const login = createRoute({
  tags: ['Auth'],
  path: '/auth/login',
  method: 'post',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().trim().min(1, 'Name is required'),
            email: z.string().email('Invalid email format'),
            idToken: z.string().trim().min(1, 'ID Token is required'),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        accessToken: z.string(),
        user: z.object({
          id: z.string(),
          name: z.string().nullable(),
          email: z.string().email(),
        }),
      }),
      'Successful login response',
    ),
    [HttpStatusCodes.NO_CONTENT]: jsonContent(
      z.object({
        success: z.literal(false),
        message: z.string(),
      }),
      'User already exists',
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      ValidationErrorSchema,
      'Validation error',
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      FirebaseAuthErrorSchema,
      'Firebase authentication failed',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      AuthErrorSchema,
      'Internal server error during authentication',
    ),
  },
})

export const refresh = createRoute({
  tags: ['Auth'],
  path: '/auth/refresh',
  method: 'get',
  request: {
    query: z.object({
      organizationId: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        accessToken: z.string(),
        user: z.object({
          id: z.string(),
          name: z.string().nullable(),
          email: z.string().email(),
        }),
      }),
      'Token refresh successful',
    ),
    [HttpStatusCodes.NO_CONTENT]: {
      description: 'No refresh token found',
    },
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      'Invalid refresh token',
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      'Expired refresh token',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      'Internal server error',
    ),
  },
})

export const logout = createRoute({
  tags: ['Auth'],
  path: '/auth/logout',
  method: 'post',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      SuccessResponseSchema,
      'Successfully logged out',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      'Internal server error',
    ),
  },
})

export type LoginRoute = typeof login
export type RefreshRoute = typeof refresh
export type LogoutRoute = typeof logout
