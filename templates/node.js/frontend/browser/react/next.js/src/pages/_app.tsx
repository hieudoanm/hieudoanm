import { APP_DESC, APP_NAME } from '@n26/constants/constants';
import '@n26/styles/globals.css';
import { trpc } from '@n26/utils/trpc';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta charSet="UTF-8" />
        <meta name="description" content={APP_DESC} />
        <meta name="author" content="Hieu Doan" />
        <meta name="keywords" content="Next.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default trpc.withTRPC(App);
