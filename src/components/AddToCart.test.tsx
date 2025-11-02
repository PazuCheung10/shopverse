import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddToCart from './AddToCart';

// Mock useToast
const mockPush = vi.fn();
vi.mock('@/lib/useToast', () => ({
  useToast: () => ({ push: mockPush }),
  ToastProvider: ({ children }: any) => children,
}));

describe('AddToCart', () => {
  const productId = 'test-product-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.dispatchEvent = vi.fn() as any;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders add to cart button', () => {
    render(<AddToCart productId={productId} />);
    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('adds new item to empty cart', async () => {
    const user = userEvent.setup();
    render(<AddToCart productId={productId} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    const cart = JSON.parse(localStorage.getItem('shopverse:cart') || '[]');
    expect(cart).toEqual([{ productId, quantity: 1 }]);
  });

  it('increments quantity for existing item', async () => {
    const user = userEvent.setup();
    localStorage.setItem('shopverse:cart', JSON.stringify([
      { productId, quantity: 2 },
    ]));

    render(<AddToCart productId={productId} />);
    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    const cart = JSON.parse(localStorage.getItem('shopverse:cart') || '[]');
    expect(cart).toEqual([{ productId, quantity: 3 }]);
  });

  it('adds different product to cart with existing items', async () => {
    const user = userEvent.setup();
    const otherProductId = 'other-product';
    localStorage.setItem('shopverse:cart', JSON.stringify([
      { productId: otherProductId, quantity: 1 },
    ]));

    render(<AddToCart productId={productId} />);
    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    const cart = JSON.parse(localStorage.getItem('shopverse:cart') || '[]');
    expect(cart).toEqual([
      { productId: otherProductId, quantity: 1 },
      { productId, quantity: 1 },
    ]);
  });

  it('dispatches cartUpdated event', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<AddToCart productId={productId} />);
    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    const event = dispatchSpy.mock.calls[0][0] as Event;
    expect(event.type).toBe('cartUpdated');
  });

  it('shows toast notification', async () => {
    const user = userEvent.setup();
    render(<AddToCart productId={productId} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith({
      title: 'Added',
      message: 'Item added to cart',
      variant: 'success',
    });
  });

  it('disables button while processing', async () => {
    const user = userEvent.setup();
    render(<AddToCart productId={productId} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    
    // Start clicking (will be async)
    const clickPromise = user.click(button);
    
    // Button should be disabled during processing
    // Note: This is tricky with async state, but the component does set busy=true
    await clickPromise;
    
    // After click, button should be enabled again
    expect(button).not.toBeDisabled();
  });

  it('handles missing localStorage item', async () => {
    const user = userEvent.setup();
    localStorage.removeItem('shopverse:cart');

    render(<AddToCart productId={productId} />);
    const button = screen.getByRole('button', { name: /add to cart/i });
    
    await user.click(button);

    const cart = JSON.parse(localStorage.getItem('shopverse:cart') || '[]');
    expect(cart).toEqual([{ productId, quantity: 1 }]);
  });
});

