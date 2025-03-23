import { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } from '@n26/environments/environments';
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripe: Stripe | null = null;

const getStripe = async (): Promise<Stripe | null> => {
  if (stripe !== null) return stripe;
  stripe = await loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return stripe;
};

export default getStripe;
