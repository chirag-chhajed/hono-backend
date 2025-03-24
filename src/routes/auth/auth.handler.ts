import type { AppRouteHandler } from "@/lib/types.js";
import type {
  LoginRoute,
  RefreshRoute,
  LogoutRoute,
} from "@/routes/auth/auth.routes.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import { UserEntity } from "@/db/entities/user.js";
import {
  generateTokens,
  type BaseTokenPayload,
  type OrgTokenPayload,
} from "@/lib/generate-tokens.js";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import type { DecodedIdToken } from "firebase-admin/auth";
import { auth } from "@/lib/create-app.js";
import { verify, decode } from "hono/jwt";
import { env } from "@/env.js";
import { JwtTokenExpired } from "hono/utils/jwt/types";

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  try {
    const { name, email, idToken } = c.req.valid("json");

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (firebaseError) {
      return c.json(
        {
          success: false,
          code: "FIREBASE_AUTH_ERROR",
          message: "Invalid or expired Firebase token",
        },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    if (decodedToken.email !== email) {
      return c.json(
        {
          success: false,
          code: "EMAIL_MISMATCH",
          message: "Token email does not match provided email",
        },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    const existingUserResult = await UserEntity.query.byEmail({ email }).go();

    let finalUser: {
      userId: string;
      email: string;
      name: string;
      createdAt: number;
      updatedAt: number;
    };

    if (!existingUserResult.data.length) {
      const newUserResult = await UserEntity.create({
        name,
        email,
      }).go();
      if (!newUserResult.data) {
        throw new Error("Failed to create user");
      }
      finalUser = newUserResult.data;
    } else {
      finalUser = existingUserResult.data[0];
    }

    const { accessToken, refreshToken } = await generateTokens({
      id: finalUser.userId,
      email: finalUser.email,
      name: finalUser.name,
    });

    setCookie(c, "refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return c.json(
      {
        accessToken,
        user: {
          id: finalUser.userId,
          name: finalUser.name,
          email: finalUser.email,
        },
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        success: false,
        message: "An unexpected error occurred during authentication",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const refresh: AppRouteHandler<RefreshRoute> = async (c) => {
  try {
    const { organizationId } = c.req.valid("query");
    const refreshToken = getCookie(c, "refreshToken");

    if (!refreshToken) {
      return c.newResponse(null, HttpStatusCodes.NO_CONTENT);
    }

    try {
      await verify(refreshToken, env.JWT_REFRESH_SECRET_KEY, "HS256");
      const { payload } = decode(refreshToken);

      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        ...(organizationId && {
          organizationId,
          role: payload.role,
        }),
      } as BaseTokenPayload | OrgTokenPayload;

      const { accessToken, refreshToken: newRefreshToken } =
        await generateTokens(tokenPayload);

      setCookie(c, "refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
      });

      return c.json(
        {
          accessToken,
          user: {
            id: tokenPayload.id,
            name: tokenPayload.name,
            email: tokenPayload.email,
          },
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      if (error instanceof JwtTokenExpired) {
        return c.json(
          {
            success: false,
            message: "Refresh token expired",
          },
          HttpStatusCodes.FORBIDDEN
        );
      }
      return c.json(
        {
          success: false,
          message: "Invalid refresh token",
        },
        HttpStatusCodes.UNAUTHORIZED
      );
    }
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const logout: AppRouteHandler<LogoutRoute> = async (c) => {
  try {
    deleteCookie(c, "refreshToken");
    return c.json(
      {
        success: true,
        message: "Successfully logged out",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
