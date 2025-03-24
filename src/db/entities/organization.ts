import { Entity } from "electrodb";
import { dynamoClient, TABLE_NAME } from "@/db/client.js";
import { nanoid } from "nanoid";

const OrganizationEntity = new Entity(
  {
    model: {
      entity: "organization",
      version: "1",
      service: "app",
    },
    attributes: {
      orgId: { type: "string", required: true, default: () => nanoid(32) },
      createdBy: { type: "string", required: true }, // userId
      name: { type: "string", required: true },
      description: { type: "string", required: false },
      createdAt: {
        type: "number",
        required: true,
        default: () => Date.now(),
        readOnly: true,
        set: () => Date.now(),
      },
      updatedAt: {
        type: "number",
        required: true,
        default: () => Date.now(),
        watch: "*",
        set: () => Date.now(),
      },
    },
    indexes: {
      primary: {
        pk: { field: "pk", composite: ["orgId"], template: "ORG#${orgId}" },
        sk: { field: "sk", composite: ["orgId"], template: "ORG#${orgId}" },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  }
);

export { OrganizationEntity };
