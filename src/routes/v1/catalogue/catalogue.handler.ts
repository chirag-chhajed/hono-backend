import { CatalogueEntity } from "@/db/entities/catalogue.js";
import { catalogueItemService } from "@/db/invitation-service.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
  CreateCatalogueRoute,
  CreateCatalogueItemRoute,
  GetCataloguesRoute,
} from "@/routes/v1/catalogue/catalogue.routes.js";
import { nanoid } from "nanoid";
import { promises } from "node:fs";
import sharp from "sharp";
import { encode } from "blurhash";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env.js";
import { s3Client } from "@/lib/s3Client.js";

export const createCatalogue: AppRouteHandler<CreateCatalogueRoute> = async (
  c
) => {
  const { name, description } = c.req.valid("json");

  const { id: userId, organizationId } = c.get("jwtPayload");

  const catalogue = await CatalogueEntity.create({
    orgId: organizationId,
    name,
    description,
    createdBy: userId,
  }).go();

  return c.json(catalogue.data, HttpStatusCodes.CREATED);
};

export const getCatalogues: AppRouteHandler<GetCataloguesRoute> = async (c) => {
  const { cursor, order = "desc" } = c.req.valid("query");
  const { organizationId } = c.get("jwtPayload");

  const catalogues = await CatalogueEntity.query
    .byOrgAndCreationTime({ orgId: organizationId })
    .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
    .go({
      cursor,
      limit: 20,
      order: order,
    });

  return c.json(
    {
      items: catalogues.data,
      nextCursor: catalogues.cursor,
    },
    HttpStatusCodes.OK
  );
};

export const createCatalogueItem: AppRouteHandler<
  CreateCatalogueItemRoute
> = async (c) => {
  const { name, price, description } = c.req.valid("query");
  const { organizationId } = c.get("jwtPayload");
  const hello = c.req.valid("form");
  const fileArray = Object.values(hello);
  const catalogueId = c.req.param("catalogueId");

  const catalogue = await CatalogueEntity.get({
    catalogueId,
    orgId: organizationId,
  }).go();

  if (!catalogue.data) {
    return c.json(
      { message: "Catalogue not found" },
      HttpStatusCodes.NOT_FOUND
    );
  }

  const itemId = nanoid(32);

  const images = await Promise.all(
    fileArray.map(async (file) => {
      try {
        const fileName = `${organizationId}/${nanoid()}.${
          file.type.split("/")[1]
        }`;
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        const { data, info } = await sharp(uint8Array)
          .resize(32, 32, {
            fit: "inside",
          })
          .toBuffer({ resolveWithObject: true });

        const blurhash = encode(
          new Uint8ClampedArray(data),
          info.width,
          info.height,
          4,
          4
        );

        const command = new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: fileName,
          Body: uint8Array,
          ContentType: file.type,
          ACL: "public-read",
        });

        await s3Client.send(command);

        return {
          orgId: organizationId,
          itemId,
          imageUrl: `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileName}`,
          blurhash,
        };
      } catch (error) {
        c.var.logger.error(
          `Failed to process image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        throw new Error(`Failed to process image: ${file.name}`);
      }
    })
  ).catch((error) => {
    throw new Error(`Failed to process images: ${error.message}`);
  });

  await catalogueItemService.transaction
    .write(({ catalogueItem, catalogueImages }) => [
      catalogueItem
        .create({
          itemId,
          catalogueId,
          name,
          price,
          description,
          orgId: organizationId,
        })
        .commit(),
      ...images.map((img) => catalogueImages.create(img).commit()),
    ])
    .go();

  return c.json(
    { message: "File uploaded successfully" },
    HttpStatusCodes.CREATED
  );
};
