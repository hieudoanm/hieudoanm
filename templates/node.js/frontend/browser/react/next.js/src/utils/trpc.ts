import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '../server/routers/_app';
import {
  PORT,
  RENDER_INTERNAL_HOSTNAME,
  VERCEL_URL,
} from '@n26/environments/environments';

const getBaseUrl = (): string => {
  // browser should use relative path
  if (typeof window !== 'undefined') return '';
  // reference for vercel.com
  if (VERCEL_URL) return `https://${VERCEL_URL}`;
  // reference for render.com
  if (RENDER_INTERNAL_HOSTNAME)
    return `http://${RENDER_INTERNAL_HOSTNAME}:${PORT}`;
  // assume localhost
  return `http://localhost:${PORT ?? 3000}`;
};

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          /**
           * If you want to use SSR, you need to use the server's full URL
           * @link https://trpc.io/docs/v11/ssr
           **/
          url: `${getBaseUrl()}/api/trpc`,
          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              // authorization: getAuthCookie(),
            };
          },
        }),
      ],
    };
  },
  /**
   * @link https://trpc.io/docs/v11/ssr
   **/
  ssr: false,
});
