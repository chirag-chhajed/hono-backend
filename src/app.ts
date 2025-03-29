import { env } from '@/env.js';
import configureOpenAPI from '@/lib/configure-open-api.js';
import createApp from '@/lib/create-app.js';
import authRoute from '@/routes/v1/auth/auth.index.js';
import catalogueRoute from '@/routes/v1/catalogue/catalogue.index.js';
import organisationRoute from '@/routes/v1/organisation/organisation.index.js';

const app = createApp();

const v1Routes = [authRoute, organisationRoute, catalogueRoute];

configureOpenAPI(app);

for (const route of v1Routes) {
  app.route('/api/v1', route);
}

app.get('/', (c) => {
  c.var.logger.info(env.PORT);
  return c.text('Hello Hono!');
});

app.get('/error', (c) => {
  c.status(422);
  c.var.logger.debug('Hello');
  throw new Error('Oh no!');
});

export default app;
