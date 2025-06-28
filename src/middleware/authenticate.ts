import type { Context, Next } from "hono";

import { decode, verify } from "hono/jwt";
import { JwtTokenExpired } from "hono/utils/jwt/types";

import type { AppBindings } from "@/lib/types.js";

import { env } from "@/env.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";

export async function authenticate(c: Context<AppBindings>, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (authHeader == null) {
    return c.json(
      {
        success: false,
        message: "Authorization header is required",
      },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  if (!authHeader.includes(" ")) {
    return c.json(
      {
        success: false,
        message: "Invalid authorization header format",
      },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  const [bearer, token] = authHeader.split(" ");

  if (bearer !== "Bearer" || !token) {
    return c.json(
      {
        success: false,
        message: "Invalid authorization header",
      },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  try {
    await verify(token, env.JWT_ACCESS_SECRET_KEY);
    const decoded = decode(token);

    // eslint-disable-next-line ts/strict-boolean-expressions
    if (!decoded?.payload) {
      return c.json(
        {
          success: false,
          message: "Invalid token format",
        },
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    c.set("jwtPayload", decoded.payload);
    await next();
  } catch (error) {
    c.var.logger.error(error);

    if (error instanceof JwtTokenExpired) {
      return c.json(
        {
          success: false,
          message: "Access token expired",
        },
        HttpStatusCodes.FORBIDDEN,
      );
    }

    return c.json(
      {
        success: false,
        message: "Invalid token",
      },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }
}

export async function requireOrganization(c: Context<AppBindings>, next: Next) {
  const payload = c.get("jwtPayload");

  if (!payload.organizationId) {
    return c.json(
      {
        success: false,
        message: "Organization ID is required in the payload",
      },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  await next();
}
