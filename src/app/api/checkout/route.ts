import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { CheckoutSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CheckoutSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.errors },
        { status: 400 }
      );
    }

    // Fetch products from DB to trust price & name
    const ids = parsed.data.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
    });

    if (products.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some products not found or inactive' },
        { status: 400 }
      );
    }

    // Build Stripe line items from trusted DB values
    const line_items = parsed.data.items.map(i => {
      const p = products.find(p => p.id === i.productId)!;
      return {
        price_data: {
          currency: p.currency,
          unit_amount: p.unitAmount,
          product_data: {
            name: p.name,
            images: [p.imageUrl],
          },
        },
        quantity: i.quantity,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
      };
    });

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items,
        success_url: `${env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/cancel`,
        customer_email: parsed.data.address.email,
        metadata: {
          cart: JSON.stringify(parsed.data.items),
        },
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'HK'],
        },
      },
      { idempotencyKey: crypto.randomUUID() }
    );

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

