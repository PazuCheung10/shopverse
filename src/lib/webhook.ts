import { stripe } from './stripe';
import { env } from './env';

export async function verifyWebhookSignature(
  body: Buffer,
  signature: string
): Promise<{ valid: boolean; event?: any }> {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
    return { valid: true, event };
  } catch (error) {
    return { valid: false };
  }
}

