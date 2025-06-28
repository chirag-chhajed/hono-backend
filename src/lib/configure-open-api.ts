import { apiReference } from '@scalar/hono-api-reference'

import type { AppOpenAPI } from '@/lib/types.js'

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.0.3',
    info: {
      version: '1.0.0',
      title: 'Tasks API',
    },
  })

  app.get(
    '/reference',
    apiReference({
      theme: 'kepler',
      layout: 'classic',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
      // @ts-expect-error<no error>
      spec: {
        url: '/doc',
      },
    }),
  )
}
