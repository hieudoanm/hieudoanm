import {
  getCountries,
  getCountry,
  syncCountries,
} from '@hono/services/countries/countries.service';
import { Context, Env, Hono } from 'hono';
import { etag } from 'hono/etag';
import { logger } from 'hono/logger';
import { BlankInput } from 'hono/types';

const basePath: string = '/api';

const app = new Hono().basePath(basePath);
app.use(etag(), logger());

app.get('/', async (context: Context<Env, typeof basePath, BlankInput>) => {
  const countries = await getCountries();
  return context.json({ countries });
});

app.post('/', async (context: Context<Env, typeof basePath, BlankInput>) => {
  const countries = await syncCountries();
  return context.json({ countries });
});

app.get('/:cca3', async (context: Context) => {
  const cca3: string = context.req.param('cca3');
  const country = await getCountry(cca3);
  return context.json({ country });
});

export const config = { runtime: 'edge' };

export default app;
