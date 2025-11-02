import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}));

vi.mock('crypto', () => ({
  randomUUID: () => 'test-idempotency-key',
}));

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates checkout session with valid payload', async () => {
    const mockProducts = [
      {
        id: 'clx12345678901234567890',
        name: 'Test Product',
        unitAmount: 1999,
        currency: 'usd',
        imageUrl: 'https://example.com/image.jpg',
      },
    ];

    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    };

    (prisma.product.findMany as any).mockResolvedValue(mockProducts);
    (stripe.checkout.sessions.create as any).mockResolvedValue(mockSession);

    const payload = {
      items: [{ productId: 'clx12345678901234567890', quantity: 2 }],
      address: {
        email: 'test@example.com',
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
      },
    };

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [
          expect.objectContaining({
            price_data: {
              currency: 'usd',
              unit_amount: 1999,
              product_data: {
                name: 'Test Product',
                images: ['https://example.com/image.jpg'],
              },
            },
            quantity: 2,
            adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
          }),
        ],
        success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/cancel',
        customer_email: 'test@example.com',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'HK'],
        },
      }),
      expect.objectContaining({ idempotencyKey: expect.any(String) })
    );
  });

  it('rejects invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: [], address: {} }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid payload');
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('rejects when products not found', async () => {
    (prisma.product.findMany as any).mockResolvedValue([]);

    const payload = {
      items: [{ productId: 'clx99999999999999999999', quantity: 1 }],
      address: {
        email: 'test@example.com',
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
      },
    };

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Some products not found or inactive');
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

