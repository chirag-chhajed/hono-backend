import { CatalogueEntity } from "@/db/entities/catalogue.js";
import { catalogueItemService } from "@/db/invitation-service.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
  CreateCatalogueRoute,
  CreateCatalogueItemRoute,
  GetCataloguesRoute,
  GetCatalogueItemsRoute,
} from "@/routes/v1/catalogue/catalogue.routes.js";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { encode } from "blurhash";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env.js";
import { s3Client } from "@/lib/s3Client.js";
import { CatalogueItemEntity } from "@/db/entities/catalogue-item.js";
import { CatalogueItemImageEntity } from "@/db/entities/catalogue-item-image.js";

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
    .primary({
      orgId: organizationId,
    })
    .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
    .go({
      cursor,
      limit: 20,
      order: order,
    });

  const images = await Promise.all(
    catalogues.data.map((catalogue) =>
      CatalogueItemImageEntity.query
        .primary({
          catalogueId: catalogue.catalogueId,
        })
        .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
        .go({
          limit: 5,
          order: "desc",
        })
    )
  );

  const result = catalogues.data.map((catalogue) => {
    const catalogueImages =
      images.find((imgResponse) =>
        imgResponse.data.some(
          (img) => img.catalogueId === catalogue.catalogueId
        )
      )?.data || [];

    return {
      ...catalogue,
      images: catalogueImages,
    };
  });

  return c.json(
    {
      items: result,
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

  const catalogue = await CatalogueEntity.query
    .primary({
      catalogueId,
      orgId: organizationId,
    })
    .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
    .go({
      count: 1,
    });

  if (catalogue.data.length === 0) {
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
          catalogueId,
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
          image: {
            imageUrl: images[0].imageUrl,
            blurhash: images[0].blurhash,
          },
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

export const getCatalogueItems: AppRouteHandler<
  GetCatalogueItemsRoute
> = async (c) => {
  const { cursor, order = "desc", priceSort } = c.req.valid("query");
  const { catalogueId } = c.req.param();

  const query = priceSort
    ? CatalogueItemEntity.query.byPrice({ catalogueId })
    : CatalogueItemEntity.query.primary({ catalogueId });

  const items = await query
    .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
    .go({
      cursor,
      limit: 20,
      order: priceSort ?? order,
    });

  return c.json(
    {
      items: items.data,
      nextCursor: items.cursor,
    },
    HttpStatusCodes.OK
  );
};
