import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const prismaClient = new PrismaClient();

const main = async () => {
  const wordsWithResults = await prismaClient.word.findMany({
    select: { word: true },
    where: { results: { isEmpty: false } },
  });
  const words: string[] = wordsWithResults.map(({ word }) => word);
  writeFileSync('./json/words-results.txt', words.join('\n'));
};

main();
