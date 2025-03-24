import { OrganizationEntity } from "@/db/entities/organization.js";
import { UserOrganizationEntity } from "@/db/entities/user-organization.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
  CreateOrganisationRoute,
  GetOrganisationsRoute,
  RemoveUserFromOrganisationRoute,
} from "@/routes/organisation/organisation.routes.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";

export const createOrganisation: AppRouteHandler<
  CreateOrganisationRoute
> = async (c) => {
  try {
    const { name, description } = c.req.valid("json");
    const { id } = c.get("jwtPayload");

    const organisation = await OrganizationEntity.create({
      name,
      description,
      createdBy: id,
    }).go();
    UserOrganizationEntity.create({
      orgId: organisation.data.orgId,
      role: "admin",
      userId: id,
    }).go();

    return c.json(
      {
        message: "Organisation created successfully",
      },
      HttpStatusCodes.CREATED
    );
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        message: "An unexpected error occurred during organisation creation",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getOrganisations: AppRouteHandler<GetOrganisationsRoute> = async (
  c
) => {
  try {
    const { id } = c.get("jwtPayload");
    const orgIds = await UserOrganizationEntity.query
      .byUser({
        userId: id,
      })
      .go();

    const orgData = await OrganizationEntity.get(
      orgIds.data.map((h) => ({ orgId: h.orgId }))
    ).go();

    const organisations = orgIds.data
      .map((orgId) => {
        const org = orgData?.data.find((o) => o.orgId === orgId.orgId);
        if (!org?.name) return null;
        return {
          orgId: orgId.orgId,
          name: org.name,
          description: org?.description,
          role: orgId.role,
        };
      })
      .filter((org) => org !== null);

    return c.json(organisations, HttpStatusCodes.OK);
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        message: "An unexpected error occurred during organisation retrieval",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const removeUserFromOrganisation: AppRouteHandler<
  RemoveUserFromOrganisationRoute
> = async (c) => {
  try {
    const { userId } = c.req.valid("param");
    const { organizationId } = c.get("jwtPayload");

    await UserOrganizationEntity.delete({
      userId: userId,
      orgId: organizationId,
    }).go();

    return c.newResponse(null, HttpStatusCodes.NO_CONTENT);
  } catch (error) {
    c.var.logger.error(error);
    return c.json(
      {
        message: "An unexpected error occurred during user removal",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
