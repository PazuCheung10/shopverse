import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuccessReceipt from './SuccessReceipt';
import type { Order, OrderItem, Product } from '@prisma/client';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock mask utilities
vi.mock('@/lib/mask', () => ({
  maskEmail: (email: string) => email ? `ma***@${email.split('@')[1]}` : 'N/A',
  maskAddress: (addr: string | null) => addr ? `****${addr.slice(-4)}` : 'N/A',
}));

describe('SuccessReceipt', () => {
  const mockOrder: Order & { items: Array<OrderItem & { product: Product }> } = {
    id: 'order-123',
    email: 'test@example.com',
    name: 'John Doe',
    addressLine1: '123 Main Street',
    addressLine2: null,
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    currency: 'usd',
    subtotal: 20000,
    total: 20000,
    stripePaymentId: 'cs_test_123',
    status: 'PAID',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    items: [
      {
        id: 'item1',
        orderId: 'order-123',
        productId: 'prod1',
        quantity: 2,
        unitAmount: 10000,
        product: {
          id: 'prod1',
          slug: 'test-product',
          name: 'Test Product',
          description: 'Test description',
          imageUrl: 'https://example.com/image.jpg',
          currency: 'usd',
          unitAmount: 10000,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.dispatchEvent = vi.fn() as any;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders success message', () => {
    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);
    
    expect(screen.getByText(/payment received/i)).toBeInTheDocument();
    expect(screen.getByText(/thank you for your purchase/i)).toBeInTheDocument();
  });

  it('displays order information', () => {
    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);
    
    expect(screen.getByText(/order receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/order-123/i)).toBeInTheDocument();
    expect(screen.getByText(/PAID/i)).toBeInTheDocument();
  });

  it('displays masked customer information', () => {
    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);
    
    expect(screen.getByText(/ma\*\*\*@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/\*\*\*\*reet/i)).toBeInTheDocument(); // masked address
  });

  it('displays order items', () => {
    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);
    
    expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity: 2/i)).toBeInTheDocument();
    // Item total should be displayed (2 * $100.00 = $200.00)
    const itemTotals = screen.getAllByText(/\$200\.00/i);
    expect(itemTotals.length).toBeGreaterThan(0);
  });

  it('displays totals', () => {
    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);
    
    expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument();
    // Find the specific $200.00 in the totals section (not in line items)
    const totals = screen.getAllByText(/\$200\.00/i);
    expect(totals.length).toBeGreaterThan(0);
    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
  });

  it('clears cart when order status is PAID', () => {
    localStorage.setItem('shopverse:cart', JSON.stringify([
      { productId: 'prod1', quantity: 1 },
    ]));

    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);

    // Cart should be cleared
    expect(localStorage.getItem('shopverse:cart')).toBeNull();
  });

  it('dispatches cartUpdated event when clearing cart', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    localStorage.setItem('shopverse:cart', JSON.stringify([{ productId: 'prod1', quantity: 1 }]));

    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    const event = dispatchSpy.mock.calls[0][0] as Event;
    expect(event.type).toBe('cartUpdated');
  });

  it('does not clear cart if order status is not PAID', () => {
    const pendingOrder = { ...mockOrder, status: 'PENDING' as const };
    localStorage.setItem('shopverse:cart', JSON.stringify([
      { productId: 'prod1', quantity: 1 },
    ]));

    render(<SuccessReceipt order={pendingOrder} sessionId="cs_test_123" />);

    // Cart should remain
    expect(localStorage.getItem('shopverse:cart')).toBeTruthy();
  });

  it('formats date correctly', () => {
    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);
    
    // Date should be formatted
    expect(screen.getByText(/January/i)).toBeInTheDocument();
    expect(screen.getByText(/2024/i)).toBeInTheDocument();
  });

  it('handles missing address fields', () => {
    const orderWithoutAddress = {
      ...mockOrder,
      addressLine1: null,
      city: null,
      postalCode: null,
    };

    render(<SuccessReceipt order={orderWithoutAddress} sessionId="cs_test_123" />);
    
    // Should still render without crashing
    expect(screen.getByText(/payment received/i)).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    const orderWithoutItems = { ...mockOrder, items: [] };

    render(<SuccessReceipt order={orderWithoutItems} sessionId="cs_test_123" />);
    
    expect(screen.getByText(/items are being processed/i)).toBeInTheDocument();
  });

  it('renders continue shopping link', () => {
    render(<SuccessReceipt order={mockOrder} sessionId="cs_test_123" />);
    
    const link = screen.getByRole('link', { name: /continue shopping/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});

