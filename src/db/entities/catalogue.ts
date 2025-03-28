import { Entity } from "electrodb";
import { dynamoClient, TABLE_NAME } from "@/db/client.js";
import { nanoid } from "nanoid";

const CatalogueEntity = new Entity({
  model: {
    entity: "catalogue",
    version: "1",
    service: "app",
  },
  attributes: {
    catalogueId: {
      type: "string",
      required: true,
      default: () => nanoid(32),
    },
    orgId: { type: "string", required: true },
    name: { type: "string", required: true },
    description: { type: "string" },
    createdBy: { type: "string", required: true }, // userId
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
    deletedAt: { type: "number", required: false },
  },
  indexes: {
    primary: {
      pk: {
        field: "pk",
        composite: ["orgId"],
      },
      sk: {
        field: "sk",
        composite: ["createdAt", "catalogueId"],
      },
    },
  },
  client: dynamoClient,
  table: TABLE_NAME,
});

export { CatalogueEntity };
