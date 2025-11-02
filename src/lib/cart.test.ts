import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCart,
  setCart,
  addItem,
  updateQty,
  removeItem,
  clearCart,
  total,
  getStoredEmail,
  saveEmail,
} from './cart';
import type { CartItem } from './validation';

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

beforeEach(() => {
  const localStorageMock = createLocalStorageMock();
  // @ts-ignore
  global.window = {
    localStorage: localStorageMock,
  };
});

afterEach(() => {
  // @ts-ignore
  delete global.window;
});

describe('cart', () => {
  describe('getCart', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(getCart()).toEqual([]);
    });

    it('returns parsed cart from localStorage', () => {
      const items: CartItem[] = [
        { productId: 'clx123', quantity: 2 },
        { productId: 'clx456', quantity: 1 },
      ];
      localStorage.setItem('shopverse:cart', JSON.stringify(items));
      expect(getCart()).toEqual(items);
    });

    it('returns empty array on server-side', () => {
      // @ts-ignore - simulate server-side
      global.window = undefined;
      expect(getCart()).toEqual([]);
      // @ts-ignore - restore
      global.window = window;
    });
  });

  describe('setCart', () => {
    it('saves cart to localStorage', () => {
      const items: CartItem[] = [{ productId: 'clx123', quantity: 1 }];
      setCart(items);
      expect(localStorage.getItem('shopverse:cart')).toBe(JSON.stringify(items));
    });

    it('limits cart to 20 items', () => {
      const items: CartItem[] = Array.from({ length: 25 }, (_, i) => ({
        productId: `clx${i}`,
        quantity: 1,
      }));
      setCart(items);
      const stored = JSON.parse(localStorage.getItem('shopverse:cart')!);
      expect(stored).toHaveLength(20);
    });
  });

  describe('addItem', () => {
    beforeEach(() => {
      clearCart();
    });

    it('adds new item to cart', () => {
      addItem('clx123', 2);
      const cart = getCart();
      expect(cart).toHaveLength(1);
      expect(cart[0]).toEqual({ productId: 'clx123', quantity: 2 });
    });

    it('increments quantity for existing item', () => {
      addItem('clx123', 2);
      addItem('clx123', 1);
      const cart = getCart();
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(3);
    });

    it('caps quantity at 10', () => {
      addItem('clx123', 5);
      addItem('clx123', 6);
      const cart = getCart();
      expect(cart[0].quantity).toBe(10);
    });

    it('defaults quantity to 1', () => {
      addItem('clx123');
      const cart = getCart();
      expect(cart[0].quantity).toBe(1);
    });
  });

  describe('updateQty', () => {
    beforeEach(() => {
      clearCart();
      addItem('clx123', 2);
    });

    it('updates quantity of existing item', () => {
      updateQty('clx123', 5);
      const cart = getCart();
      expect(cart[0].quantity).toBe(5);
    });

    it('removes item when quantity is 0', () => {
      updateQty('clx123', 0);
      expect(getCart()).toHaveLength(0);
    });

    it('caps quantity at 10', () => {
      updateQty('clx123', 15);
      const cart = getCart();
      expect(cart[0].quantity).toBe(10);
    });

    it('does nothing if item not found', () => {
      updateQty('clx999', 5);
      const cart = getCart();
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(2);
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      clearCart();
      addItem('clx123', 2);
      addItem('clx456', 1);
    });

    it('removes item by productId', () => {
      removeItem('clx123');
      const cart = getCart();
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe('clx456');
    });

    it('does nothing if item not found', () => {
      removeItem('clx999');
      expect(getCart()).toHaveLength(2);
    });
  });

  describe('clearCart', () => {
    beforeEach(() => {
      addItem('clx123', 2);
    });

    it('removes cart from localStorage', () => {
      clearCart();
      expect(localStorage.getItem('shopverse:cart')).toBeNull();
    });
  });

  describe('total', () => {
    it('calculates total from items and products', () => {
      const items: CartItem[] = [
        { productId: 'clx123', quantity: 2 },
        { productId: 'clx456', quantity: 1 },
      ];
      const products = new Map([
        ['clx123', { unitAmount: 1000, currency: 'usd' }],
        ['clx456', { unitAmount: 2000, currency: 'usd' }],
      ]);

      expect(total(items, products)).toBe(4000); // 2 * 1000 + 1 * 2000
    });

    it('ignores items with missing products', () => {
      const items: CartItem[] = [
        { productId: 'clx123', quantity: 2 },
        { productId: 'clx999', quantity: 1 },
      ];
      const products = new Map([
        ['clx123', { unitAmount: 1000, currency: 'usd' }],
      ]);

      expect(total(items, products)).toBe(2000);
    });

    it('returns 0 for empty cart', () => {
      expect(total([], new Map())).toBe(0);
    });
  });

  describe('email storage', () => {
    beforeEach(() => {
      localStorage.removeItem('shopverse:email');
    });

    it('saves and retrieves email', () => {
      saveEmail('test@example.com');
      expect(getStoredEmail()).toBe('test@example.com');
    });

    it('returns null when email not stored', () => {
      expect(getStoredEmail()).toBeNull();
    });
  });
});

