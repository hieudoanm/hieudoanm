import million from 'million/compiler';
import nextPWA from 'next-pwa';

const NODE_ENV = process.env.NODE_ENV ?? 'development';

const withPWA = nextPWA({
  dest: 'public',
  disable: NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };

export default million.next(withPWA(nextConfig));
