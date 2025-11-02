import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Mock dependencies
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      upsert: vi.fn(),
    },
  },
}));

import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    (headers as any).mockResolvedValue({
      get: () => null,
    });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing stripe-signature');
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it('returns 400 when signature is invalid', async () => {
    (headers as any).mockResolvedValue({
      get: () => 'invalid-signature',
    });

    (stripe.webhooks.constructEvent as any).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid signature');
  });

  it('processes checkout.session.completed event with valid signature', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer_details: {
            email: 'test@example.com',
            name: 'John Doe',
            address: {
              line1: '123 Main St',
              city: 'New York',
              state: 'NY',
              postal_code: '10001',
              country: 'US',
            },
          },
          currency: 'usd',
          amount_subtotal: 1999,
          amount_total: 1999,
        },
      },
    };

    const mockOrder = {
      id: 'clx_order_123',
      stripePaymentId: 'cs_test_123',
      status: 'PAID',
    };

    (headers as any).mockResolvedValue({
      get: () => 'valid-signature',
    });

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    (prisma.order.upsert as any).mockResolvedValue(mockOrder);

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
    expect(prisma.order.upsert).toHaveBeenCalledWith({
      where: { stripePaymentId: 'cs_test_123' },
      create: expect.objectContaining({
        stripePaymentId: 'cs_test_123',
        email: 'test@example.com',
        name: 'John Doe',
        currency: 'usd',
        subtotal: 1999,
        total: 1999,
        status: 'PAID',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      }),
      update: { status: 'PAID' },
    });
  });

  it('returns 500 when STRIPE_WEBHOOK_SECRET is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    (headers as any).mockResolvedValue({
      get: () => 'valid-signature',
    });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration missing');
  });
});

