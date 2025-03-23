import { createServer } from 'node:http';
import { VaultClient } from './clients/vault.client';

const PORT: string = process.env.PORT ?? '8080';

const server = createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/json' });
  const vaultClient = new VaultClient({
    apiVersion: 'v1',
    endpoint: 'http://localhost:8200',
    token: '83df719b-2d56-4d2e-85cb-e11bb961a580',
  });
  const secret: string = await vaultClient.getSecret<string>('test', 'TEST');
  res.end(JSON.stringify({ secret }));
});

// starts a simple http server locally on port 3000
server.listen(parseFloat(PORT), '127.0.0.1', () => {
  console.log(`Listening on 127.0.0.1:${PORT}`);
});
