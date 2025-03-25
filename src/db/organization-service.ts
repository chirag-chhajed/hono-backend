import { Service } from "electrodb";
import { OrganizationEntity } from "./entities/organization.js";
import { UserOrganizationEntity } from "./entities/user-organization.js";
import { dynamoClient, TABLE_NAME } from "./client.js";

export const organizationService = new Service(
  {
    organisation: OrganizationEntity,
    userOrganization: UserOrganizationEntity,
  },
  {
    table: TABLE_NAME,
    client: dynamoClient,
  }
);
