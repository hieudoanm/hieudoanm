import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (prismaClient !== null) return prismaClient;
  prismaClient = new PrismaClient();
  return prismaClient;
};
