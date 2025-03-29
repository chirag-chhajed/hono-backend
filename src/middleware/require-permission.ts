import type { Context, Next } from 'hono';

import type { Permission, ROLE } from '@/lib/role.js';
import type { AppBindings } from '@/lib/types.js';

import * as HttpStatusCodes from '@/lib/http-status-code.js';
import { hasPermission } from '@/lib/role.js';

export function requirePermission(permission: Permission) {
  return async (c: Context<AppBindings>, next: Next) => {
    const { id, role } = c.get('jwtPayload');

    const hasAccess = hasPermission({ id, role: role as ROLE }, permission);

    if (!hasAccess) {
      c.json(
        {
          success: false,
          message: 'You don\'t have permission to access this resource',
        },
        HttpStatusCodes.BAD_REQUEST,
      );
      return;
    }

    await next();
  };
}
