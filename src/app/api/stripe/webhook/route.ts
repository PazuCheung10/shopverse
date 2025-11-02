import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

export const runtime = 'nodejs'; // Required for raw body access

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature');
  
  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await req.arrayBuffer());
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    try {
      // Upsert order (idempotent on stripePaymentId)
      // This ensures we don't create duplicate orders if webhook is retried
      await prisma.order.upsert({
        where: { stripePaymentId: session.id },
        create: {
          stripePaymentId: session.id,
          email: session.customer_details?.email ?? '',
          name: session.customer_details?.name ?? undefined,
          currency: session.currency ?? 'usd',
          subtotal: session.amount_subtotal ?? 0,
          total: session.amount_total ?? 0,
          status: 'PAID',
          addressLine1: session.customer_details?.address?.line1 ?? undefined,
          addressLine2: session.customer_details?.address?.line2 ?? undefined,
          city: session.customer_details?.address?.city ?? undefined,
          state: session.customer_details?.address?.state ?? undefined,
          postalCode: session.customer_details?.address?.postal_code ?? undefined,
          country: session.customer_details?.address?.country ?? undefined,
        },
        update: { 
          status: 'PAID',
          // Update totals in case they changed (e.g., shipping adjustments)
          subtotal: session.amount_subtotal ?? 0,
          total: session.amount_total ?? 0,
        },
      });
      
      console.log(`Order upserted: ${session.id} for ${session.customer_details?.email ?? 'unknown'}`);
    } catch (error) {
      console.error('Failed to upsert order:', error);
      // Return 500 so Stripe will retry the webhook
      return NextResponse.json(
        { error: 'Failed to process order', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

