import express, { Request, Response } from 'express';

const app = express();
const PORT: string = process.env.PORT ?? '8080';

app.get('/', (request: Request, response: Response) => {
  const { query } = request;
  const { name } = query;
  response.json({ messagee: `Hello ${name ?? 'World'}` });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
