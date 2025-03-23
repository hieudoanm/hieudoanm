import { config } from '@dotenvx/dotenvx';
import { createServer } from 'node:http';
import { drizzle } from 'drizzle-orm/node-postgres';
import { usersTable } from './db/schema';

config();

const db = drizzle(process.env.DATABASE_URL!);

const server = createServer(async (req, res) => {
  const users = await db.select().from(usersTable);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ users }));
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});

// run with `node server.mjs`
