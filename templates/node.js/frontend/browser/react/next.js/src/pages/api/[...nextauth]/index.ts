import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getPrismaClient } from '@n26/prisma/prisma.client';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '@n26/environments/environments';
import { OAuthUserConfig } from 'next-auth/providers/oauth';

const googleProviderOptions: OAuthUserConfig<unknown> = {
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(getPrismaClient()),
  providers: [GoogleProvider(googleProviderOptions)],
  session: { strategy: 'jwt' },
};
