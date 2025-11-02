import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPrice } from './currency';

describe('currency', () => {
  describe('formatCurrency', () => {
    it('formats USD amounts from cents to dollars', () => {
      expect(formatCurrency(1000, 'usd')).toBe('$10.00');
      expect(formatCurrency(1999, 'usd')).toBe('$19.99');
      expect(formatCurrency(0, 'usd')).toBe('$0.00');
      expect(formatCurrency(1, 'usd')).toBe('$0.01');
    });

    it('defaults to USD when currency not provided', () => {
      expect(formatCurrency(1000)).toBe('$10.00');
    });

    it('handles different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€10.00');
      expect(formatCurrency(1000, 'GBP')).toBe('£10.00');
    });
  });

  describe('formatPrice', () => {
    it('formats prices using formatCurrency', () => {
      expect(formatPrice(1000, 'usd')).toBe('$10.00');
      expect(formatPrice(2500, 'usd')).toBe('$25.00');
    });

    it('defaults to USD when currency not provided', () => {
      expect(formatPrice(1000)).toBe('$10.00');
    });
  });
});

