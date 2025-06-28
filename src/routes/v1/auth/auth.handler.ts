import type { DecodedIdToken } from "firebase-admin/auth";

import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { decode, verify } from "hono/jwt";
import { JwtTokenExpired } from "hono/utils/jwt/types";

import type {
  BaseTokenPayload,
  OrgTokenPayload,
} from "@/lib/generate-tokens.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
  LoginRoute,
  LogoutRoute,
  RefreshRoute,
} from "@/routes/v1/auth/auth.routes.js";

import { UserOrganizationEntity } from "@/db/entities/user-organization.js";
import { UserEntity } from "@/db/entities/user.js";
import { env } from "@/env.js";
import { generateTokens } from "@/lib/generate-tokens.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import { verifyIdToken } from "@/lib/verify-token.js";

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  try {
    const { name, email, idToken } = c.req.valid("json");

    // Step 1: Verify Firebase ID token
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch {
      return c.json(
        {
          success: false,
          code: "FIREBASE_AUTH_ERROR",
          message: "Invalid or expired Firebase token",
        },
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    // Step 2: Check email matches token
    if (decodedToken.email !== email) {
      return c.json(
        {
          success: false,
          code: "EMAIL_MISMATCH",
          message: "Token email does not match provided email",
        },
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    // Step 3: Check if user already exists in DB
    const existingUserResult = await UserEntity.query.byEmail({ email }).go();

    let finalUser: {
      userId: string;
      email: string;
      name: string;
      createdAt: number;
      updatedAt: number;
    };

    if (!existingUserResult.data.length) {
      // New user, create in DB
      const newUserResult = await UserEntity.create({
        name,
        email,
      }).go();

      if (Object.keys(newUserResult.data).length === 0) {
        throw new Error("Failed to create user");
      }
      finalUser = newUserResult.data;
    } else {
      finalUser = existingUserResult.data[0];
    }

    // Step 4: Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateTokens({
      id: finalUser.userId,
      email: finalUser.email,
      name: finalUser.name,
    });

    // Step 5: Set refresh token in cookie
    setCookie(c, "refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Step 6: Return response
    return c.json(
      {
        accessToken,
        user: {
          id: finalUser.userId,
          name: finalUser.name,
          email: finalUser.email,
        },
      },
      HttpStatusCodes.OK,
    );
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        success: false,
        message: "An unexpected error occurred during authentication",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const refresh: AppRouteHandler<RefreshRoute> = async (c) => {
  try {
    const query = c.req.valid("query");
    const refreshToken = getCookie(c, "refreshToken");

    if (refreshToken == null) {
      return c.newResponse(null, HttpStatusCodes.NO_CONTENT);
    }

    try {
      await verify(refreshToken, env.JWT_REFRESH_SECRET_KEY, "HS256");
      const { payload } = decode(refreshToken);
      let orgDetails;

      if (query.organizationId != null) {
        orgDetails = await UserOrganizationEntity.get({
          orgId: query.organizationId,
          userId: payload.id as string,
        }).go();
        if (!orgDetails.data) {
          return c.json(
            {
              success: false,
              message: "Organization not found",
            },
            HttpStatusCodes.BAD_REQUEST,
          );
        }
      }

      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        ...(query.organizationId != null && {
          organizationId: query.organizationId,
          role: orgDetails?.data?.role,
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
          user: tokenPayload,
        },
        HttpStatusCodes.OK,
      );
    } catch (error) {
      if (error instanceof JwtTokenExpired) {
        return c.json(
          {
            success: false,
            message: "Refresh token expired",
          },
          HttpStatusCodes.FORBIDDEN,
        );
      }
      return c.json(
        {
          success: false,
          message: "Invalid refresh token",
        },
        HttpStatusCodes.UNAUTHORIZED,
      );
    }
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
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
      HttpStatusCodes.OK,
    );
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
