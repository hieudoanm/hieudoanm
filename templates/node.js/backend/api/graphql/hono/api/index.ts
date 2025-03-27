import { type RootResolver, graphqlServer } from '@hono/graphql-server';
import { buildSchema } from 'graphql';
import { Hono } from 'hono';
import { etag } from 'hono/etag';
import { logger } from 'hono/logger';

const basePath: string = '/graphql';

const app = new Hono().basePath(basePath);
app.use(etag(), logger());

const schema = buildSchema(`
type Query {
  hello: String
}
`);

const rootResolver: RootResolver = () => {
  return {
    hello: () => 'Hello Hono!',
  };
};

app.use(
  '/',
  graphqlServer({
    schema,
    rootResolver,
    graphiql: true, // if `true`, presents GraphiQL when the GraphQL endpoint is loaded in a browser.
  })
);

export const config = { runtime: 'edge' };

export default app;
