export const PORT: string = process.env.PORT ?? '3000';
// Google Client
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
// Hosting
export const RENDER_INTERNAL_HOSTNAME: string =
  process.env.RENDER_INTERNAL_HOSTNAME ?? '';
export const VERCEL_URL: string = process.env.VERCEL_URL ?? '';
// Stripe
export const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
export const STRIPE_SECRET_KEY: string = process.env.STRIPE_SECRET_KEY ?? '';
