import {
  graphql,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { createServer } from 'node:http';

// Define schema
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve() {
          return 'world';
        },
      },
    },
  }),
});

const server = createServer((request, response) => {
  if (request.method === 'POST') {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', async () => {
      const { source } = JSON.parse(body);
      const result = await graphql({
        schema,
        source,
      });
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(result));
    });
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Hello World!\n');
});

const PORT: number = parseInt(process.env.PORT ?? '5000') ?? 5000;

// starts a simple http server locally on port 5000
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Listening on 127.0.0.1:${PORT}`);
});

// run with `node server.mjs`
