import { Service } from "electrodb";
import { InvitationEntity } from "@/db/entities/invitation.js";
import { UserOrganizationEntity } from "@/db/entities/user-organization.js";
import { TABLE_NAME, dynamoClient } from "@/db/client.js";

export const InvitationService = new Service(
  {
    invitationEntity: InvitationEntity,
    userOrganization: UserOrganizationEntity,
  },
  {
    table: TABLE_NAME,
    client: dynamoClient,
  }
);
