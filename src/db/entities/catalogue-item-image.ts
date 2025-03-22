import { Entity } from "electrodb";
import { dynamoClient, TABLE_NAME } from "@/db/client.js";
import { nanoid } from "nanoid";

const CatalogueItemImageEntity = new Entity({
  model: {
    entity: "catalogueItemImage",
    version: "1",
    service: "app",
  },
  attributes: {
    imageId: { type: "string", required: true,default: () => nanoid(32) },
    orgId: { type: "string", required: true },
    imageUrl: { type: "string", required: true },
    blurhash: { type: "string" },
    createdAt: { type: "number", required: true,default: () => Date.now() },
    deletedAt: { type: "number" },
  },
  indexes: {
    primary: {
      pk: { field: "pk", composite: ["orgId"], template: "ORG#${orgId}" },
      sk: { field: "sk", composite: ["imageId"], template: "IMAGE#${imageId}" },
    },
  },
},{
    client: dynamoClient,
    table: TABLE_NAME
});

export {CatalogueItemImageEntity}