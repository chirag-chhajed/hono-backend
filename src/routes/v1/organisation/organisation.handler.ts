import { ulid } from "ulid";

import type { AppRouteHandler } from "@/lib/types.js";
import type {
  CreateOrganisationRoute,
  GetOrganisationsRoute,
  GetUsersInOrganisationRoute,
  RemoveUserFromOrganisationRoute,
} from "@/routes/v1/organisation/organisation.routes.js";

import { UserOrganizationEntity } from "@/db/entities/user-organization.js";
import { UserEntity } from "@/db/entities/user.js";
import { organizationService } from "@/db/organization-service.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";

export const createOrganisation: AppRouteHandler<
  CreateOrganisationRoute
> = async (c) => {
  try {
    const { name, description } = c.req.valid("json");
    const { id } = c.get("jwtPayload");
    const orgId = ulid();
    await organizationService.transaction
      .write(({ organisation, userOrganization }) => [
        organisation
          .create({
            name,
            description,
            createdBy: id,
            orgId,
          })
          .commit(),
        userOrganization
          .create({
            orgId,
            role: "admin",
            userId: id,
            orgName: name,
            orgDescription: description,
          })
          .commit(),
      ])
      .go();

    return c.json(
      {
        message: "Organisation created successfully",
      },
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        message: "An unexpected error occurred during organisation creation",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getOrganisations: AppRouteHandler<GetOrganisationsRoute> = async (
  c,
) => {
  try {
    const { id } = c.get("jwtPayload");
    const orgIds = await UserOrganizationEntity.query
      .byUser({
        userId: id,
      })
      .go();
    const organisations = orgIds.data.map((org) => ({
      name: org.orgName,
      description: org.orgDescription,
      orgId: org.orgId,
      role: org.role,
    }));

    return c.json(organisations, HttpStatusCodes.OK);
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        message: "An unexpected error occurred during organisation retrieval",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getUsersInOrganisation: AppRouteHandler<
  GetUsersInOrganisationRoute
> = async (c) => {
  const { organizationId } = c.get("jwtPayload");

  const usersMetadata = await UserOrganizationEntity.query
    .primary({
      orgId: organizationId,
    })
    .go();

  const users = await UserEntity.get(
    usersMetadata.data.map((user) => ({ userId: user.userId })),
  ).go();

  return c.json(users.data, HttpStatusCodes.OK);
};

export const removeUserFromOrganisation: AppRouteHandler<
  RemoveUserFromOrganisationRoute
> = async (c) => {
  try {
    const { userId } = c.req.valid("param");
    const { organizationId } = c.get("jwtPayload");

    await UserOrganizationEntity.delete({
      userId,
      orgId: organizationId,
    }).go();

    return c.json(
      {
        success: true,
        message: "User removed from organisation",
      },
      HttpStatusCodes.OK,
    );
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        message: "An unexpected error occurred during user removal",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
