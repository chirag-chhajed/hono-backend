import { InvitationEntity } from "@/db/entities/invitation.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
  CreateInvitationRoute,
  GetInvitationsRoute,
} from "@/routes/v1/invitation/invitation.routes.js";
import { addDays } from "date-fns";
import { nanoid } from "nanoid";
import * as HttpStatusCodes from "@/lib/http-status-code.js";

export const createInvitation: AppRouteHandler<CreateInvitationRoute> = async (
  c
) => {
  const { role } = c.req.valid("json");
  const { id, organizationId } = c.get("jwtPayload");

  const invitation = await InvitationEntity.create({
    code: nanoid(10),
    orgId: organizationId,
    createdBy: id,
    role,
    expiresAt: addDays(new Date(), 7).getTime(),
  }).go();

  return c.json(
    {
      inviteCode: invitation.data.code,
    },
    HttpStatusCodes.CREATED
  );
};

export const getInvitations: AppRouteHandler<GetInvitationsRoute> = async (
  c
) => {
  const { organizationId } = c.get("jwtPayload");

  const invitations = await InvitationEntity.query
    .primary({
      orgId: organizationId,
    })
    .go();

  return c.json(invitations.data, HttpStatusCodes.OK);
};
