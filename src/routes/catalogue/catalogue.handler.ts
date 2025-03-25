import { CatalogueEntity } from "@/db/entities/catalogue.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type {
  CreateCatalogueRoute,
  GetCataloguesRoute,
} from "./catalogue.routes.js";

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
