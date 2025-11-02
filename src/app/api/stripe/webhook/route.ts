import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // Required for raw body access

// Health check endpoint
export async function GET() {
  return NextResponse.json({ ok: true, route: 'stripe/webhook' }, { status: 200 });
}

export async function POST(req: Request) {
  // Fast 400 if missing signature header (prevents hanging/timeouts)
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
      // 1) Upsert the Order row first (idempotent by stripePaymentId)
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
        select: { id: true },
      });

      // 2) Fetch Stripe line items with expanded product metadata
      const lineItems = await stripe.checkout.sessions.listLineItems(s.id, {
        expand: ['data.price.product'],
        limit: 100,
      });

      // 3) Map line items → our DB productIds via product metadata
      const itemsForDb = lineItems.data
        .map((li: any) => {
          const productMeta = li.price?.product?.metadata ?? {};
          const appProductId = productMeta.app_product_id as string | undefined;
          if (!appProductId) return null; // skip if metadata missing
          const qty = li.quantity ?? 1;
          // Prefer Stripe-reported unit amount if available; fall back to per-unit by subtotal / qty
          const unitAmount =
            typeof li.price?.unit_amount === 'number'
              ? li.price.unit_amount
              : Math.round((li.amount_subtotal ?? 0) / Math.max(qty, 1));

          return {
            orderId: order.id,
            productId: appProductId,
            quantity: qty,
            unitAmount, // minor units
          };
        })
        .filter(Boolean) as {
          orderId: string;
          productId: string;
          quantity: number;
          unitAmount: number;
        }[];

      // 4) Replace items atomically (idempotent)
      await prisma.$transaction([
        prisma.orderItem.deleteMany({ where: { orderId: order.id } }),
        ...(itemsForDb.length ? [prisma.orderItem.createMany({ data: itemsForDb })] : []),
      ]);

      console.log('🧾 Order upserted:', order.id, order.status);
      console.log(`   📦 ${itemsForDb.length} OrderItems persisted`);
    } catch (error) {
      console.error('❌ Failed to process order:', error);
      // Return 500 so Stripe will retry
      return NextResponse.json(
        { error: 'Failed to process order' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
