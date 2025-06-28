import { addDays, addMinutes } from "date-fns";
import { sign } from "hono/jwt";

import { env } from "@/env.js";

export type BaseTokenPayload = {
  id: string;
  email: string;
  name: string;
};

export type OrgTokenPayload = BaseTokenPayload & {
  organizationId: string;
  role: "admin" | "editor" | "viewer";
};

type GeneratedTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function generateTokens(
  payload: BaseTokenPayload | OrgTokenPayload,
): Promise<GeneratedTokens> {
  // Access token configuration
  const accessTokenPayload = {
    ...payload,
    exp: addMinutes(new Date(), 15).getTime() / 1000,
  };

  // Refresh token configuration
  const refreshTokenPayload = {
    ...payload,
    exp: addDays(new Date(), 7).getTime() / 1000,
  };

  // Sign tokens
  const accessToken = await sign(
    accessTokenPayload,
    env.JWT_ACCESS_SECRET_KEY,
    "HS256",
  );
  const refreshToken = await sign(
    refreshTokenPayload,
    env.JWT_REFRESH_SECRET_KEY,
    "HS256",
  );

  return {
    accessToken,
    refreshToken,
  };
}
