import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Mock dependencies
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    checkout: {
      sessions: {
        listLineItems: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      upsert: vi.fn(),
    },
    orderItem: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops.map((op: any) => op()))),
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('POST /api/stripe/webhook - OrderItem persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (headers as any).mockResolvedValue({
      get: () => 'valid-signature',
    });
  });

  it('persists OrderItems when line items have app_product_id metadata', async () => {
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
          amount_subtotal: 5000,
          amount_total: 5000,
        },
      },
    };

    const mockOrder = {
      id: 'clx_order_123',
      stripePaymentId: 'cs_test_123',
      status: 'PAID',
    };

    const mockLineItems = {
      data: [
        {
          quantity: 2,
          price: {
            unit_amount: 2500,
            product: {
              metadata: {
                app_product_id: 'prod_db_123',
              },
            },
          },
          amount_subtotal: 5000,
        },
      ],
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    (stripe.checkout.sessions.listLineItems as any).mockResolvedValue(mockLineItems);
    (prisma.order.upsert as any).mockResolvedValue(mockOrder);
    (prisma.orderItem.deleteMany as any).mockResolvedValue({ count: 0 });
    (prisma.orderItem.createMany as any).mockResolvedValue({ count: 1 });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });

    // Verify OrderItems were created
    expect(prisma.orderItem.deleteMany).toHaveBeenCalledWith({
      where: { orderId: 'clx_order_123' },
    });
    expect(prisma.orderItem.createMany).toHaveBeenCalledWith({
      data: [
        {
          orderId: 'clx_order_123',
          productId: 'prod_db_123',
          quantity: 2,
          unitAmount: 2500,
        },
      ],
    });
  });

  it('skips line items gracefully when metadata is missing', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_456',
          customer_details: { email: 'test@example.com' },
          currency: 'usd',
          amount_subtotal: 3000,
          amount_total: 3000,
        },
      },
    };

    const mockOrder = {
      id: 'clx_order_456',
      stripePaymentId: 'cs_test_456',
      status: 'PAID',
    };

    const mockLineItems = {
      data: [
        {
          quantity: 1,
          price: {
            unit_amount: 3000,
            product: {
              metadata: {}, // No app_product_id
            },
          },
          amount_subtotal: 3000,
        },
      ],
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    (stripe.checkout.sessions.listLineItems as any).mockResolvedValue(mockLineItems);
    (prisma.order.upsert as any).mockResolvedValue(mockOrder);
    (prisma.orderItem.deleteMany as any).mockResolvedValue({ count: 0 });
    (prisma.orderItem.createMany as any).mockResolvedValue({ count: 0 });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);

    expect(response.status).toBe(200);

    // Should delete old items but not create new ones (filtered out)
    expect(prisma.orderItem.deleteMany).toHaveBeenCalled();
    // createMany should be called with empty array or skipped
    expect(prisma.orderItem.createMany).toHaveBeenCalledWith({
      data: [],
    });
  });

  it('handles idempotency correctly (replaces items on duplicate webhook)', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_789',
          customer_details: { email: 'test@example.com' },
          currency: 'usd',
          amount_subtotal: 2000,
          amount_total: 2000,
        },
      },
    };

    const mockOrder = {
      id: 'clx_order_789',
      stripePaymentId: 'cs_test_789',
      status: 'PAID',
    };

    const mockLineItems = {
      data: [
        {
          quantity: 1,
          price: {
            unit_amount: 2000,
            product: {
              metadata: {
                app_product_id: 'prod_db_789',
              },
            },
          },
          amount_subtotal: 2000,
        },
      ],
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    (stripe.checkout.sessions.listLineItems as any).mockResolvedValue(mockLineItems);
    (prisma.order.upsert as any).mockResolvedValue(mockOrder);
    (prisma.orderItem.deleteMany as any).mockResolvedValue({ count: 2 }); // Had 2 items before
    (prisma.orderItem.createMany as any).mockResolvedValue({ count: 1 });

    // First call
    const req1 = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });
    await POST(req1);

    // Second call (idempotent)
    const req2 = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });
    await POST(req2);

    // Should delete old items each time, then create fresh
    expect(prisma.orderItem.deleteMany).toHaveBeenCalledTimes(2);
    expect(prisma.orderItem.createMany).toHaveBeenCalledTimes(2);
    // Each time should create the same item
    expect(prisma.orderItem.createMany).toHaveBeenLastCalledWith({
      data: [
        {
          orderId: 'clx_order_789',
          productId: 'prod_db_789',
          quantity: 1,
          unitAmount: 2000,
        },
      ],
    });
  });

  it('uses fallback unit amount calculation when unit_amount is missing', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_fallback',
          customer_details: { email: 'test@example.com' },
          currency: 'usd',
          amount_subtotal: 6000,
          amount_total: 6000,
        },
      },
    };

    const mockOrder = {
      id: 'clx_order_fallback',
      stripePaymentId: 'cs_test_fallback',
      status: 'PAID',
    };

    const mockLineItems = {
      data: [
        {
          quantity: 3,
          price: {
            // No unit_amount
            product: {
              metadata: {
                app_product_id: 'prod_db_fallback',
              },
            },
          },
          amount_subtotal: 6000, // Total for 3 items
        },
      ],
    };

    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    (stripe.checkout.sessions.listLineItems as any).mockResolvedValue(mockLineItems);
    (prisma.order.upsert as any).mockResolvedValue(mockOrder);
    (prisma.orderItem.deleteMany as any).mockResolvedValue({ count: 0 });
    (prisma.orderItem.createMany as any).mockResolvedValue({ count: 1 });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    await POST(req);

    // Should calculate unit amount: 6000 / 3 = 2000
    expect(prisma.orderItem.createMany).toHaveBeenCalledWith({
      data: [
        {
          orderId: 'clx_order_fallback',
          productId: 'prod_db_fallback',
          quantity: 3,
          unitAmount: 2000,
        },
      ],
    });
  });
});
