import { Entity } from "electrodb";
import { dynamoClient, TABLE_NAME } from "@/db/client.js";

const UserOrganizationEntity = new Entity(
  {
    model: {
      entity: "userOrganization",
      version: "1",
      service: "app",
    },
    attributes: {
      orgId: { type: "string", required: true },
      userId: { type: "string", required: true },
      role: { type: ["admin", "editor", "viewer"], required: true },
      joinedAt: {
        type: "number",
        required: true,
        default: () => Date.now(),
        readOnly: true,
        set: () => Date.now(),
      },
    },
    indexes: {
      primary: {
        pk: { field: "pk", composite: ["orgId"], template: "ORG#${orgId}" },
        sk: { field: "sk", composite: ["userId"], template: "USER#${userId}" },
      },
      byUser: {
        index: "gsi1",
        pk: {
          field: "gsi1pk",
          composite: ["userId"],
          template: "USER#${userId}",
        },
        sk: { field: "gsi1sk", composite: ["orgId"], template: "ORG#${orgId}" },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  }
);

export { UserOrganizationEntity };
