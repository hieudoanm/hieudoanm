import { PrismaClient } from '@prisma/client';

export let prismaClient = new PrismaClient();

export const getPrismaClient = (): PrismaClient => {
  if (prismaClient !== undefined) return prismaClient;
  prismaClient = new PrismaClient();
  return prismaClient;
};
