import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

const main = async () => {
  const count = await prismaClient.word.count();
  console.log(count);
};

main();
