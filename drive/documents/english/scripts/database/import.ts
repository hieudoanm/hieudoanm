import { PrismaClient } from '../../src/generated/prisma/client';
import { readdirSync, readFileSync } from 'node:fs';

const prismaClient = new PrismaClient({ adapter: 'postgresql' });

const main = async () => {
	const folder = './english/words';
	const files = readdirSync(folder);
	console.log(files.length);

	for (const file of files) {
		const jsonString: string = readFileSync(`${folder}/${file}`, 'utf-8');
		const json = JSON.parse(jsonString);
		const { word = '', results = [], frequency = 0 } = json;
		console.log(word);
		if (word !== '') {
			await prismaClient.word.upsert({
				create: { word, results, frequency },
				update: { word, results, frequency },
				where: { word },
			});
		}
	}
};

main();
