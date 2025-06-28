import { Service } from 'electrodb'

import { dynamoClient, TABLE_NAME } from '@/db/client.js'
import { OrganizationEntity } from '@/db/entities/organization.js'
import { UserOrganizationEntity } from '@/db/entities/user-organization.js'

export const organizationService = new Service(
  {
    organisation: OrganizationEntity,
    userOrganization: UserOrganizationEntity,
  },
  {
    table: TABLE_NAME,
    client: dynamoClient,
  },
)
