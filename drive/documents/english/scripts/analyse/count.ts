import { PrismaClient } from '../../src/generated/prisma/client';

const prismaClient = new PrismaClient({ adapter: 'postgresql' });

const main = async () => {
	const count = await prismaClient.word.count();
	console.log(count);
};

main();
