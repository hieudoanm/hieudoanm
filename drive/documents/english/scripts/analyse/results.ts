import { PrismaClient, Word } from '../../src/generated/prisma/client';
import { writeFileSync } from 'node:fs';

const prismaClient = new PrismaClient({ adapter: 'postgresql' });

const main = async () => {
	const wordsWithResults: { word: Word }[] = await prismaClient.word.findMany({
		select: { word: true },
		where: { results: { isEmpty: false } },
	});
	const words: string[] = wordsWithResults.map(({ word }) => word);
	writeFileSync('./json/words-results.txt', words.join('\n'));
};

main();
