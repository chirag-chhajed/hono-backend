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
      role: { type: ["admin", "editor", "viewer"] as const, required: true },
      joinedAt: {
        type: "number",
        required: true,
        default: () => Date.now(),
        readOnly: true,
        set: () => Date.now(),
      },

      orgName: { type: "string", required: true },
      orgDescription: { type: "string", required: false },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: ["orgId"],
        },
        sk: {
          field: "sk",
          composite: ["userId"],
        },
      },
      byUser: {
        index: "gsi1",
        pk: {
          field: "gsi1pk",
          composite: ["userId"],
        },
        sk: { field: "gsi1sk", composite: ["orgId"] },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  },
);

export { UserOrganizationEntity };
