import { PrismaClient, Word } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const prismaClient = new PrismaClient();

const main = async () => {
  const words = await prismaClient.word.findMany();
  const data: string = words
    .map((word: Word) => JSON.stringify(word))
    .join('\n');
  writeFileSync('./english/words.jsonl', data);
};

main();
