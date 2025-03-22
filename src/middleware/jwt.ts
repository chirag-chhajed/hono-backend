import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { env } from '@/env.js';
import type { AppBindings } from '@/lib/types.js';
import { getCookie } from 'hono/cookie';
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import { JwtTokenExpired } from 'hono/utils/jwt/types';

export const verifyRefreshToken = async (c: Context<AppBindings>, next: Next) => {
  try {
    const refreshToken = getCookie(c, 'refreshToken');
    if (!refreshToken) {
      return c.json({
        success: false as const,
        message: 'No refresh token found',
      }, HttpStatusCodes.UNAUTHORIZED);
    }

    try {
      const decoded = await verify(refreshToken, env.JWT_REFRESH_SECRET_KEY as string);
      c.set('jwtPayload', decoded as AppBindings['Variables']['jwtPayload']);
      await next();
    } catch (error) {
      if (error instanceof JwtTokenExpired) {
        return c.json({
          success: false as const,
          message: 'Refresh token expired',
        }, HttpStatusCodes.FORBIDDEN);
      }
      return c.json({
        success: false as const,
        message: 'Invalid refresh token',
      }, HttpStatusCodes.UNAUTHORIZED);
    }
  } catch (error) {
    c.var.logger.error(error);
    return c.json({
      success: false as const,
      message: 'An unexpected error occurred',
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}; 