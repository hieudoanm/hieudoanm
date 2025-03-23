import { PrismaClient } from '@prisma/client';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';

const prismaClient = new PrismaClient();

const server = createServer(
  async (
    request: IncomingMessage,
    response: ServerResponse<IncomingMessage> & {
      req: IncomingMessage;
    },
  ) => {
    try {
      if (request.url === 'users') {
        if (request.method === 'GET') {
          await prismaClient.$connect();
          const users = await prismaClient.user.findMany();
          await prismaClient.$disconnect();
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: null, users }));
          return;
        } else if (request.method === 'POST') {
          let body = '';
          request.on('data', (chunk) => (body += chunk));
          request.on('end', async () => {
            const { username = '', email = '' } = JSON.parse(body);
            const user = await prismaClient.user.create({
              data: { username, email },
            });
            await prismaClient.$disconnect();
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: null, user }));
          });
          return;
        } else {
          response.writeHead(405, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      } else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Not Found' }));
      }
    } catch (error) {
      console.error(error);
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Internal Server Error' }));
    } finally {
      await prismaClient.$disconnect();
    }
  },
);

// starts a simple http server locally on port 8080
server.listen(8080, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:8080');
});
