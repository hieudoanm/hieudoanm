import express, { Request, Response } from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import { buildSchema } from 'graphql';
import { ruruHTML } from 'ruru/server';

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

// The root provides a resolver function for each API endpoint
const root = {
  hello() {
    return 'Hello world!';
  },
};

const PORT: string = process.env.PORT ?? '4000';

const main = () => {
  const app = express();

  app.get('/', (request: Request, response: Response) => {
    const { query } = request;
    console.log(query);
    response.type('html');
    response.end(ruruHTML({ endpoint: '/graphql' }));
  });

  app.all(
    '/graphql',
    createHandler({
      schema: schema,
      rootValue: root,
    }),
  );

  app.listen(PORT);
  console.log(
    `Running a GraphQL API server at http://localhost:${PORT}/graphql`,
  );
};

main();
