import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // Required for raw body access

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  // Validate webhook secret is set
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is missing. Get it from: stripe listen --forward-to localhost:3000/api/stripe/webhook');
    return NextResponse.json(
      { 
        error: 'Server configuration missing',
        message: 'STRIPE_WEBHOOK_SECRET is not set. Run "stripe listen --forward-to localhost:3000/api/stripe/webhook" and copy the whsec_... value to .env.local, then restart the dev server.'
      },
      { status: 500 }
    );
  }

  // Read raw body (must use arrayBuffer, never req.json())
  const buf = Buffer.from(await req.arrayBuffer());
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Invalid signature', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('✅ Webhook received:', event.type);

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as any;

    try {
      const order = await prisma.order.upsert({
        where: { stripePaymentId: s.id },
        create: {
          stripePaymentId: s.id,
          email: s.customer_details?.email ?? '',
          name: s.customer_details?.name ?? undefined,
          currency: s.currency ?? 'usd',
          subtotal: s.amount_subtotal ?? 0,
          total: s.amount_total ?? 0,
          status: 'PAID',
          addressLine1: s.customer_details?.address?.line1 ?? undefined,
          addressLine2: s.customer_details?.address?.line2 ?? undefined,
          city: s.customer_details?.address?.city ?? undefined,
          state: s.customer_details?.address?.state ?? undefined,
          postalCode: s.customer_details?.address?.postal_code ?? undefined,
          country: s.customer_details?.address?.country ?? undefined,
        },
        update: { status: 'PAID' },
      });

      console.log('🧾 Order upserted:', order.id, order.status);
    } catch (error) {
      console.error('❌ Failed to upsert order:', error);
      // Return 500 so Stripe will retry
      return NextResponse.json(
        { error: 'Failed to process order' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
