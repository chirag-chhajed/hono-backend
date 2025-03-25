import { InvitationEntity } from "@/db/entities/invitation.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
  CreateInvitationRoute,
  GetInvitationsRoute,
  AcceptInvitationRoute,
} from "@/routes/v1/invitation/invitation.routes.js";
import { addDays, isPast } from "date-fns";
import { nanoid } from "nanoid";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import { UserOrganizationEntity } from "@/db/entities/user-organization.js";
import { InvitationService } from "@/db/invitation-service.js";
import { OrganizationEntity } from "@/db/entities/organization.js";

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

export const acceptInvitation: AppRouteHandler<AcceptInvitationRoute> = async (
  c
) => {
  const { code } = c.req.valid("json");
  const { id } = c.get("jwtPayload");

  const userOrgs = await UserOrganizationEntity.query
    .byUser({
      userId: id,
    })
    .go();

  const invitation = await InvitationEntity.query
    .byCode({
      code,
    })
    .go();

  const org = await OrganizationEntity.get({
    orgId: invitation.data[0].orgId,
  }).go();

  if (!org.data?.name) {
    return c.json(
      {
        message: "Organization not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }
  if (!invitation.data.length) {
    return c.json(
      {
        message: "Invitation not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  if (isPast(invitation.data[0].expiresAt)) {
    return c.json(
      {
        message: "Invitation expired",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  const userOrg = userOrgs.data.find(
    (org) => org.orgId === invitation.data[0].orgId
  );

  if (userOrg) {
    return c.json(
      {
        message: "User already in organization",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  await InvitationService.transaction
    .write(({ invitationEntity, userOrganization }) => [
      invitationEntity
        .patch({
          invitationId: invitation.data[0].invitationId,
          orgId: invitation.data[0].orgId,
        })
        .set({
          usedBy: id,
          usedAt: Date.now(),
        })
        .commit(),
      userOrganization
        .create({
          orgId: invitation.data[0].orgId,
          userId: id,
          role: invitation.data[0].role,
          // @ts-ignore
          orgName: org.data?.name,
          orgDescription: org.data?.description,
        })
        .commit(),
    ])
    .go();

  return c.json(
    {
      message: "Invitation accepted",
    },
    HttpStatusCodes.OK
  );
};
