import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { CheckoutSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { checkoutRateLimiter, getClientId } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // Rate limiting: check before processing
  const clientId = getClientId(req);
  const rateLimit = checkoutRateLimiter.check(clientId);

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many checkout requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
        },
      }
    );
  }

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
    const ids = parsed.data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
    });

    // Validate all products exist and are active
    if (products.length !== ids.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = ids.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        {
          error: 'Some products not found or inactive',
          details: `Missing product IDs: ${missingIds.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Build Stripe line items from trusted DB values
    const line_items = parsed.data.items.map((i) => {
      const p = products.find((p) => p.id === i.productId)!;
      return {
        price_data: {
          currency: p.currency,
          unit_amount: p.unitAmount,
          product_data: {
            name: p.name,
            images: [p.imageUrl],
            // Crucial: let webhook map Stripe line item back to our DB product
            metadata: { app_product_id: p.id },
          },
        },
        quantity: i.quantity,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
      };
    });

    // Validate and apply promo code if provided
    let discounts = undefined;
    if (parsed.data.promoCode && env.NEXT_PUBLIC_ENABLE_PROMO_CODES) {
      try {
        // Note: Stripe TypeScript types don't include 'code' in CouponListParams,
        // but the API supports it at runtime
        const coupons = await stripe.coupons.list({ code: parsed.data.promoCode.toUpperCase(), limit: 1 } as any);
        if (coupons.data.length > 0 && coupons.data[0].valid && !coupons.data[0].deleted) {
          discounts = [{ coupon: coupons.data[0].id }];
        } else {
          return NextResponse.json(
            { error: 'Invalid or expired promo code' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error validating promo code:', error);
        return NextResponse.json(
          { error: 'Failed to validate promo code' },
          { status: 500 }
        );
      }
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items,
        ...(discounts && { discounts }),
        success_url: `${env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/cancel`,
        customer_email: parsed.data.address.email,
        metadata: {
          cart: JSON.stringify(parsed.data.items),
          ...(parsed.data.promoCode && { promoCode: parsed.data.promoCode }),
        },
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'HK'],
        },
      },
      { idempotencyKey: crypto.randomUUID() }
    );

    return NextResponse.json(
      { id: session.id, url: session.url },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    
    // Handle Stripe-specific errors
    if (error instanceof Error && 'type' in error) {
      return NextResponse.json(
        { error: 'Stripe error', message: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

