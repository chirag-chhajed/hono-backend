import { hasPermission, type Permission, type ROLE } from "@/lib/role.js";
import type { AppBindings } from "@/lib/types.js";
import type { Context, Next } from "hono";
import * as HttpStatusCodes from "@/lib/http-status-code.js";

export const requirePermission = (permission: Permission) => {
  return async (c: Context<AppBindings>, next: Next) => {
    const { id, role } = c.get("jwtPayload");

    const hasAccess = hasPermission({ id, role: role as ROLE }, permission);

    if (!hasAccess) {
      c.json(
        {
          success: false,
          message: "You don't have permission to access this resource",
        },
        HttpStatusCodes.BAD_REQUEST
      );
      return;
    }

    await next();
  };
};
