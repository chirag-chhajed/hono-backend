import type { Context, Next } from 'hono';

import { decode, verify } from 'hono/jwt';
import { JwtTokenExpired } from 'hono/utils/jwt/types';

import type { AppBindings } from '@/lib/types.js';

import { env } from '@/env.js';
import * as HttpStatusCodes from '@/lib/http-status-code.js';

export async function authenticate(c: Context<AppBindings>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    c.json({
      success: false,
      message: 'Authorization header is required',
    }, HttpStatusCodes.UNAUTHORIZED);
    return;
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    c.json({
      success: false,
      message: 'Invalid authorization header',
    }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    await verify(token, env.JWT_ACCESS_SECRET_KEY);
    const { payload } = decode(token);
    c.set('jwtPayload', payload);
    await next();
  }
  catch (error) {
    c.var.logger.error(error);
    if (error instanceof JwtTokenExpired) {
      c.json({
        success: false,
        message: 'Access token expired',
      }, HttpStatusCodes.FORBIDDEN);
      return;
    }

    c.json({
      success: false,
      message: 'Invalid token',
    }, HttpStatusCodes.UNAUTHORIZED);
  }
}

export async function requireOrganization(c: Context<AppBindings>, next: Next) {
  const { organizationId } = c.get('jwtPayload');

  if (!organizationId) {
    c.json({
      success: false,
      message: 'Organization ID is required in the payload',
    }, HttpStatusCodes.BAD_REQUEST);
    return;
  }

  await next();
}
