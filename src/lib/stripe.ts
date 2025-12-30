import Stripe from 'stripe';
import { env } from './env';

// Singleton Stripe instance
// Using API version supported by Stripe SDK v14.25.0
const getStripe = (): Stripe => {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
};

export const stripe = getStripe();

