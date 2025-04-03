import { PutObjectCommand } from '@aws-sdk/client-s3';
import { encode } from 'blurhash';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';
import {Buffer} from 'node:buffer'
import sharp from 'sharp';

import type { AppRouteHandler } from '@/lib/types.js';
import type {
  AllItemsRoute,
  BulkDeleteItemsRoute,
  BulkTransferItemsRoute,
  BulkUpdatePricesRoute,
  CreateCatalogueItemRoute,
  CreateCatalogueRoute,
  DeleteCatalogueItemRoute,
  DeleteCatalogueRoute,
  GetCatalogueItemsRoute,
  GetCataloguesRoute,
  SearchAllCatalogueItemsRoute,
  SearchCatalogueItemsRoute,
  SearchCataloguesRoute,
  UpdateCatalogueItemRoute,
  UpdateCatalogueRoute,
} from '@/routes/v1/catalogue/catalogue.routes.js';

import { CatalogueItemImageEntity } from '@/db/entities/catalogue-item-image.js';
import { CatalogueItemEntity } from '@/db/entities/catalogue-item.js';
import { CatalogueEntity } from '@/db/entities/catalogue.js';
import { catalogueItemService } from '@/db/invitation-service.js';
import { env } from '@/env.js';
import { calculateAdjustedPrice } from '@/lib/calculate-adjusted-price.js';
import * as HttpStatusCodes from '@/lib/http-status-code.js';
import { s3Client } from '@/lib/s3Client.js';

export const createCatalogue: AppRouteHandler<CreateCatalogueRoute> = async (
  c,
) => {
  const { name, description } = c.req.valid('json');
  const jwtPayload = c.get('jwtPayload');
  const catalogue = await CatalogueEntity.create({
    orgId: jwtPayload.organizationId,
    name,
    description,
    createdBy: jwtPayload.id,
  }).go();

  return c.json(catalogue.data, HttpStatusCodes.CREATED);
};

export const getCatalogues: AppRouteHandler<GetCataloguesRoute> = async (c) => {
  const { cursor, order = 'desc' } = c.req.valid('query');
  const { organizationId } = c.get('jwtPayload');

  const catalogues = await CatalogueEntity.query
    .byOrgId({
      orgId: organizationId,
    })
    .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
    .go({
      cursor,
      limit: 20,
      order,
    });

  const images = await Promise.all(
    catalogues.data.map(async catalogue =>
      CatalogueItemImageEntity.query
        .byCatalogueId({
          catalogueId: catalogue.catalogueId,
        })
        .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
        .go({
          limit: 5,
          order: 'desc',
        }),
    ),
  );

  const result = catalogues.data.map((catalogue) => {
    const catalogueImages
      = images.find(imgResponse =>
        imgResponse.data.some(
          img => img.catalogueId === catalogue.catalogueId,
        ),
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
    HttpStatusCodes.OK,
  );
};

export const createCatalogueItem: AppRouteHandler<CreateCatalogueItemRoute> = async (c) => {
  const { name, price, description } = c.req.valid('query');
  const { organizationId } = c.get('jwtPayload');
  const existingCatalogue = await c.req.parseBody();
  // console.log(existingCatalogue,"existingCatalogue")
  const fileArray = Object.values(existingCatalogue) as File[]
  const catalogueId = c.req.param('catalogueId');
  // console.log(fileArray)
  // console.log(existingCatalogue)
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
      { message: 'Catalogue not found' },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const itemId = nanoid(32);

  const images = await Promise.all(
    fileArray.map(async (file) => {
      try {
        const fileName = `${organizationId}/${nanoid()}.${
          file.type.split('/')[1]
        }`;
        const buffer = await file.arrayBuffer();
        const uint8Array = Buffer.from(buffer)

        const { data, info } = await sharp(uint8Array)
          .resize(32, 32, {
            fit: 'inside',
          }).ensureAlpha().raw()
          .toBuffer({ resolveWithObject: true })

        const blurhash = encode(
          new Uint8ClampedArray(data.buffer),
          info.width,
          info.height,
          4,
          4,
        );
        const command = new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: fileName,
          Body: uint8Array,
          ContentType: file.type,
          ACL: 'public-read',
        });

        await s3Client.send(command);

        return {
          orgId: organizationId,
          itemId,
          imageUrl: `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileName}`,
          blurhash,
          catalogueId,
        };
      }
      catch (error) {
        c.var.logger.error(
          `Failed to process image: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
        throw new Error(`Failed to process image: ${file.name}`);
      }
    }),
  ).catch((error) => {
     console.error('Detailed error:', error);
    throw new Error(`Failed to process images`);
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
          // uploadedAt is auto-added by default
        },
        // createdAt is auto-added by default
      })
      .commit(),
    ...images.map(img => catalogueImages.create({
      itemId, 
      catalogueId, 
      orgId: organizationId, 
      imageUrl: img.imageUrl, 
      blurhash: img.blurhash,

    }).commit()),
  ])
  .go();

  return c.json(
    { message: 'File uploaded successfully' },
    HttpStatusCodes.CREATED,
  );
};

export const getCatalogueItems: AppRouteHandler<GetCatalogueItemsRoute> = async (c) => {
  const { cursor, order = 'desc', priceSort } = c.req.valid('query');
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
    HttpStatusCodes.OK,
  );
};

export const allItems: AppRouteHandler<AllItemsRoute> = async (c) => {
  const { cursor, order = 'desc' } = c.req.valid('query');

  const { organizationId } = c.get('jwtPayload');

  const { data, cursor: nextCursor } = await CatalogueItemEntity.query.byOrganization({
    orgId: organizationId,
  })
    .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
    .go({
      cursor,
      limit: 20,
      order,
    });

  return c.json({
    items: data,
    nextCursor: nextCursor ?? null,
  }, HttpStatusCodes.OK);
};

type catalogueDetails = {
  description?: string | undefined;
  name: string;
  catalogueId: string;
  orgId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | undefined;
};

export const bulkUpdatePrices: AppRouteHandler<BulkUpdatePricesRoute> = async (c) => {
  const { items, operation, value, mode, direction, newCatalogueId } = c.req.valid('json');

  const { organizationId, id: userId } = c.get('jwtPayload');

  const existingItems = (await CatalogueItemEntity.get(items).go()).data.filter(item => item.orgId === organizationId && !item.deletedAt);

  if (items.length !== existingItems.length) {
    return c.json({
      message: 'Invalid items',
    }, HttpStatusCodes.BAD_REQUEST);
  }

  if (operation === 'clone') {
    let catalogueDetails: catalogueDetails;
    if (newCatalogueId) {
      const existingCatalogue = await CatalogueEntity.query.primary({
        catalogueId: newCatalogueId,
        orgId: organizationId,
      }).where(({ deletedAt }, { notExists }) => notExists(deletedAt)).go({
        count: 1,
      });
      catalogueDetails = existingCatalogue.data[0];
    }
    else {
      const newCatalogue = await CatalogueEntity.create({
        orgId: organizationId,
        name: `Bulk Price Update ${format(new Date(), 'dd/MM/yyyy')}`,
        description: `This catalogue was created by bulk price update on ${format(new Date(), 'dd/MM/yyyy')}`,
        createdBy: userId,
      }).go();
      catalogueDetails = newCatalogue.data;
    }
    const ids = Array.from({
      length: existingItems.length,
    }, () => nanoid(32));
    const existingImages = await CatalogueItemImageEntity.get(existingItems.map(item => ({ itemId: item.itemId }))).go();

    const newItems = existingItems.map((item, index) => {
      return {
        ...item,
        catalogueId: catalogueDetails.catalogueId,
        price: calculateAdjustedPrice({
          direction,
          mode,
          price: item.price,
          value,
        }),
        itemId: ids[index],
      };
    });

    const newImages = existingImages.data.map((image, index) => {
      return {
        ...image,
        itemId: ids[index],
        catalogueId: catalogueDetails.catalogueId,
      };
    });

    await catalogueItemService.transaction.write(({ catalogueItem, catalogueImages }) => [
      ...newItems.map(item => catalogueItem.create(item).commit()),
      ...newImages.map(image => catalogueImages.create(image).commit()),
    ]).go();
  }
  else {
    await CatalogueItemEntity.put(existingItems.map(item => ({
      ...item,
      price: calculateAdjustedPrice({
        direction,
        mode,
        price: item.price,
        value,
      }),
    }))).go();
  }

  return c.json({
    message: 'Prices updated successfully',
  }, HttpStatusCodes.OK);
};

export const bulkTransferItems: AppRouteHandler<BulkTransferItemsRoute> = async (c) => {
  const { items, newCatalogueId, operation } = c.req.valid('json');

  const { organizationId, id: userId } = c.get('jwtPayload');
  let catalogueDetails: catalogueDetails;
  const existingItems = (await CatalogueItemEntity.get(items).go()).data.filter(item => item.orgId === organizationId && !item.deletedAt);
  if (items.length !== existingItems.length) {
    return c.json({
      message: 'Invalid items',
    }, HttpStatusCodes.BAD_REQUEST);
  }
  const ids = Array.from({
    length: existingItems.length,
  }, () => nanoid(32));
  const existingImages = await CatalogueItemImageEntity.get(existingItems.map(item => ({ itemId: item.itemId }))).go();

  if (newCatalogueId) {
    const existingCatalogue = await CatalogueEntity.query.primary({
      catalogueId: newCatalogueId,
      orgId: organizationId,
    }).where(({ deletedAt }, { notExists }) => notExists(deletedAt)).go({
      count: 1,
    });
    catalogueDetails = existingCatalogue.data[0];
  }
  else {
    const newCatalogue = await CatalogueEntity.create({
      orgId: organizationId,
      name: `Bulk Price Update ${format(new Date(), 'dd/MM/yyyy')}`,
      description: `This catalogue was created by bulk price update on ${format(new Date(), 'dd/MM/yyyy')}`,
      createdBy: userId,
    }).go();
    catalogueDetails = newCatalogue.data;
  }
  const newItems = existingItems.map((item, index) => {
    return {
      ...item,
      catalogueId: catalogueDetails.catalogueId,
      itemId: ids[index],
    };
  });

  const newImages = existingImages.data.map((image, index) => {
    return {
      ...image,
      itemId: ids[index],
      catalogueId: catalogueDetails.catalogueId,
    };
  });
  if (operation === 'clone') {
    await catalogueItemService.transaction.write(({ catalogueItem, catalogueImages }) => [
      ...newItems.map(item => catalogueItem.create(item).commit()),
      ...newImages.map(image => catalogueImages.create(image).commit()),
    ]).go();
  }
  else {
    const now = Date.now();

    await catalogueItemService.transaction.write(({ catalogueItem, catalogueImages }) => [
      ...existingItems.map(item => catalogueItem.put({ ...item, deletedAt: now }).commit()),
      ...existingImages.data.map(image => catalogueImages.put({ ...image, deletedAt: now }).commit()),
      ...newItems.map(item => catalogueItem.create(item).commit()),
      ...newImages.map(image => catalogueImages.create(image).commit()),
    ]).go();
  }
  return c.json({
    message: 'Items transferred successfully',
  }, HttpStatusCodes.OK);
};

export const bulkDeleteItems: AppRouteHandler<BulkDeleteItemsRoute> = async (c) => {
  const { items } = c.req.valid('json');
  const { organizationId } = c.get('jwtPayload');

  const existingItems = (await CatalogueItemEntity.get(items).go()).data.filter(item => item.orgId === organizationId && !item.deletedAt);

  if (items.length !== existingItems.length) {
    return c.json({
      message: 'Invalid items',
    }, HttpStatusCodes.BAD_REQUEST);
  }
  const existingImages = await CatalogueItemImageEntity.get(existingItems.map(item => ({ itemId: item.itemId }))).go();

  const now = Date.now();

  await catalogueItemService.transaction.write(({ catalogueItem, catalogueImages }) => [
    ...existingItems.map(item => catalogueItem.put({ ...item, deletedAt: now }).commit()),
    ...existingImages.data.map(image => catalogueImages.put({ ...image, deletedAt: now }).commit()),
  ]).go();

  return c.json({
    message: 'Items deleted successfully',
  }, HttpStatusCodes.OK);
};

export const updateCatalogue: AppRouteHandler<UpdateCatalogueRoute> = async (c) => {
  const { name, description, createdAt } = c.req.valid('json');
  const { catalogueId } = c.req.param();
  const { organizationId } = c.get('jwtPayload');

  await CatalogueEntity.patch({
    catalogueId,
    orgId: organizationId,
    createdAt,
  }).set({
    name,
    description,
  }).go();

  return c.json({
    message: 'Catalogue updated successfully',
  }, HttpStatusCodes.OK);
};

export const deleteCatalogue: AppRouteHandler<DeleteCatalogueRoute> = async (c) => {
  const { catalogueId } = c.req.param();
  const { organizationId } = c.get('jwtPayload');
  const { createdAt } = c.req.valid('json');

  const items = await CatalogueItemEntity.query.primary({
    catalogueId,
    orgId: organizationId,
  }).where(({ deletedAt }, { notExists }) => notExists(deletedAt)).go();

  if (items.data.length > 0) {
    return c.json({
      message: 'Catalogue is not empty',
    }, HttpStatusCodes.BAD_REQUEST);
  }

  await CatalogueEntity.patch({
    catalogueId,
    orgId: organizationId,
    createdAt,
  }).set({
    deletedAt: Date.now(),
  }).go();

  return c.newResponse(null, HttpStatusCodes.NO_CONTENT);
};

export const updateCatalogueItem: AppRouteHandler<UpdateCatalogueItemRoute> = async (c) => {
  const { name, description, price, createdAt } = c.req.valid('json');
  const { catalogueId, itemId } = c.req.param();
  const { organizationId } = c.get('jwtPayload');

  const catalogue = await CatalogueEntity.query.primary({
    catalogueId,
    orgId: organizationId,
  }).where(({ deletedAt }, { notExists }) => notExists(deletedAt)).go({
    count: 1,
  });

  if (catalogue.data.length === 0) {
    return c.json({
      message: 'Catalogue not found',
    }, HttpStatusCodes.NOT_FOUND);
  }

  await catalogueItemService.transaction.write(({ catalogueItem }) => [
    catalogueItem.patch({
      itemId,
      catalogueId,
      createdAt,
    }).set({
      name,
      description,
      price,
    }).commit(),
  ]).go();

  return c.json({
    message: 'Catalogue item updated successfully',
  }, HttpStatusCodes.OK);
};

export const deleteCatalogueItem: AppRouteHandler<DeleteCatalogueItemRoute> = async (c) => {
  const { itemId, catalogueId } = c.req.param();
  const { organizationId } = c.get('jwtPayload');
  const { createdAt } = c.req.valid('json');
  const catalogue = await CatalogueEntity.query.primary({
    catalogueId,
    orgId: organizationId,
  }).where(({ deletedAt }, { notExists }) => notExists(deletedAt)).go({
    count: 1,
  });

  if (catalogue.data.length === 0) {
    return c.json({
      message: 'Catalogue not found',
    }, HttpStatusCodes.NOT_FOUND);
  }

  const now = Date.now();

  await catalogueItemService.transaction.write(({ catalogueItem, catalogueImages }) => [
    catalogueItem.patch({
      itemId,
      catalogueId,
      createdAt,
    }).set({
      deletedAt: now,
    }).commit(),
    catalogueImages.patch({
      itemId,
    }).set({
      deletedAt: now,
    }).commit(),
  ]).go();

  return c.newResponse(null, HttpStatusCodes.NO_CONTENT);
};

export const searchCatalogues: AppRouteHandler<SearchCataloguesRoute> = async (c) => {
  const { search } = c.req.valid('query');
  const { organizationId } = c.get('jwtPayload');
  const catalogues = await CatalogueEntity.query.byOrgId({
    orgId: organizationId,
  }).where(({ deletedAt }, { notExists }) => notExists(deletedAt)).where(({ name, description }, { contains }) => `${contains(name, search)} OR ${contains(description, search)}`).go();

  const images = await Promise.all(
    catalogues.data.map(async catalogue =>
      CatalogueItemImageEntity.query
        .byCatalogueId({
          catalogueId: catalogue.catalogueId,
        })
        .where(({ deletedAt }, { notExists }) => notExists(deletedAt))
        .go({
          limit: 5,
          order: 'desc',
        }),
    ),
  );

  const result = catalogues.data.map((catalogue) => {
    const catalogueImages
      = images.find(imgResponse =>
        imgResponse.data.some(
          img => img.catalogueId === catalogue.catalogueId,
        ),
      )?.data || [];

    return {
      ...catalogue,
      images: catalogueImages,
    };
  });
  return c.json({
    items: result,
  }, HttpStatusCodes.OK);
};

export const searchAllCatalogueItems: AppRouteHandler<SearchAllCatalogueItemsRoute> = async (c) => {
  const { search } = c.req.valid('query');
  const { organizationId } = c.get('jwtPayload');
  const items = await CatalogueItemEntity.query.byOrganization({
    orgId: organizationId,
  }).where(({ deletedAt }, { notExists }) => notExists(deletedAt)).where(({ name, description }, { contains }) => `${contains(name, search)} OR ${contains(description, search)}`).go({
    order: 'desc',
  });

  return c.json({
    items: items.data,
  }, HttpStatusCodes.OK);
};

export const searchCatalogueItems: AppRouteHandler<SearchCatalogueItemsRoute> = async (c) => {
  const { search } = c.req.valid('query');
  const { catalogueId } = c.req.param();
  const { organizationId } = c.get('jwtPayload');

  const items = await CatalogueItemEntity.query.primary({
    catalogueId,
  }).where(({ deletedAt }, { notExists }) => notExists(deletedAt)).where(({ name, description }, { contains }) => `${contains(name, search)} OR ${contains(description, search)}`).go({
    order: 'desc',
  }).then(items => items.data.filter(item => item.orgId === organizationId));

  return c.json({
    items,
  }, HttpStatusCodes.OK);
};
