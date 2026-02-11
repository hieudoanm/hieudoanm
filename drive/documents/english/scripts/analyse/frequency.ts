import { PrismaClient } from '../../src/generated/prisma/client';
import { writeFileSync } from 'node:fs';
import { Parser } from '@json2csv/plainjs';

const prismaClient = new PrismaClient({ adapter: 'postgresql' });

const main = async () => {
	const wordsWithFrequency = await prismaClient.word.findMany({
		select: { word: true, frequency: true },
		where: { frequency: { gt: 0 } },
		orderBy: { frequency: 'desc' },
	});
	const opts = { fields: ['word', 'frequency'] };
	const parser = new Parser(opts);
	const csv = parser.parse(wordsWithFrequency);
	writeFileSync('./json/words-frequency.csv', csv);
};

main();
