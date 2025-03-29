import { Service } from 'electrodb';

import { dynamoClient, TABLE_NAME } from '@/db/client.js';
import { CatalogueItemImageEntity } from '@/db/entities/catalogue-item-image.js';
import { CatalogueItemEntity } from '@/db/entities/catalogue-item.js';
import { InvitationEntity } from '@/db/entities/invitation.js';
import { UserOrganizationEntity } from '@/db/entities/user-organization.js';

export const InvitationService = new Service(
  {
    invitationEntity: InvitationEntity,
    userOrganization: UserOrganizationEntity,
  },
  {
    table: TABLE_NAME,
    client: dynamoClient,
  },
);

export const catalogueItemService = new Service(
  {
    catalogueItem: CatalogueItemEntity,
    catalogueImages: CatalogueItemImageEntity,
  },
  {
    table: TABLE_NAME,
    client: dynamoClient,
  },
);
