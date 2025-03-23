import { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

const Document: React.FC = () => {
  return (
    <Html lang="en" data-theme="light">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
