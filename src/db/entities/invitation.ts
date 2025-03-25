import { Entity } from "electrodb";
import { dynamoClient, TABLE_NAME } from "@/db/client.js";
import { nanoid } from "nanoid";

const InvitationEntity = new Entity(
  {
    model: {
      entity: "invitation",
      version: "1",
      service: "app",
    },
    attributes: {
      invitationId: {
        type: "string",
        required: true,
        default: () => nanoid(32),
      },
      orgId: { type: "string", required: true },
      code: { type: "string", required: true },
      createdBy: { type: "string", required: true }, // userId (admin)
      expiresAt: { type: "number", required: true },
      usedBy: { type: "string" }, // userId (optional)
      usedAt: { type: "number" },
      role: { type: ["admin", "editor", "viewer"], required: true }, // timestamp (optional)
      createdAt: {
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
        sk: {
          field: "sk",
          composite: ["invitationId"],
          template: "INVITATION#${invitationId}",
        },
      },
      byCode: {
        index: "gsi1",
        pk: { field: "gsi1pk", composite: ["code"], template: "CODE#${code}" },
        sk: {
          field: "gsi1sk",
          composite: ["invitationId"],
          template: "INVITATION#${invitationId}",
        },
      },
    },
  },
  {
    client: dynamoClient,
    table: TABLE_NAME,
  }
);

export { InvitationEntity };
