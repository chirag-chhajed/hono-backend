import { Entity } from "electrodb";
import { dynamoClient, TABLE_NAME } from "@/db/client.js";
import { nanoid } from "nanoid";

const CatalogueItemEntity = new Entity(
  {
    model: {
      entity: "catalogueItem",
      version: "1",
      service: "app",
    },
    attributes: {
      itemId: { type: "string", required: true, default: () => nanoid(32) },
      catalogueId: { type: "string", required: true },
      orgId: { type: "string", required: true },
      name: { type: "string", required: true },
      description: { type: "string" },
      price: { type: "number", required: true },
      metadata: { type: "any" }, // JSON object
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
      deletedAt: { type: "number" },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: ["catalogueId"],
          template: "CAT#${catalogueId}",
        },
        sk: { field: "sk", composite: ["itemId"], template: "ITEM#${itemId}" },
      },
      byOrg: {
        index: "gsi1",
        pk: { field: "gsi1pk", composite: ["orgId"], template: "ORG#${orgId}" },
        sk: {
          field: "gsi1sk",
          composite: ["itemId"],
          template: "ITEM#${itemId}",
        },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  }
);

export { CatalogueItemEntity };
