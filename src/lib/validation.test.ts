import { describe, it, expect } from 'vitest';
import { CartItemSchema, AddressSchema, CheckoutSchema } from './validation';

describe('validation', () => {
  describe('CartItemSchema', () => {
    it('validates valid cart item', () => {
      const valid = { productId: 'clx12345678901234567890', quantity: 2 };
      expect(CartItemSchema.parse(valid)).toEqual(valid);
    });

    it('rejects invalid productId (not cuid)', () => {
      expect(() => {
        CartItemSchema.parse({ productId: 'invalid', quantity: 1 });
      }).toThrow();
    });

    it('rejects quantity below 1', () => {
      expect(() => {
        CartItemSchema.parse({ productId: 'clx12345678901234567890', quantity: 0 });
      }).toThrow();
    });

    it('rejects quantity above 10', () => {
      expect(() => {
        CartItemSchema.parse({ productId: 'clx12345678901234567890', quantity: 11 });
      }).toThrow();
    });
  });

  describe('AddressSchema', () => {
    const validAddress = {
      email: 'test@example.com',
      name: 'John Doe',
      addressLine1: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      country: 'US',
    };

    it('validates valid address', () => {
      expect(AddressSchema.parse(validAddress)).toEqual(validAddress);
    });

    it('validates address with optional fields', () => {
      const withOptionals = {
        ...validAddress,
        addressLine2: 'Apt 4B',
        state: 'NY',
      };
      expect(AddressSchema.parse(withOptionals)).toEqual(withOptionals);
    });

    it('rejects invalid email', () => {
      expect(() => {
        AddressSchema.parse({ ...validAddress, email: 'invalid-email' });
      }).toThrow();
    });

    it('rejects empty name', () => {
      expect(() => {
        AddressSchema.parse({ ...validAddress, name: '' });
      }).toThrow();
    });

    it('rejects name longer than 80 chars', () => {
      expect(() => {
        AddressSchema.parse({ ...validAddress, name: 'a'.repeat(81) });
      }).toThrow();
    });

    it('rejects country code not 2 characters', () => {
      expect(() => {
        AddressSchema.parse({ ...validAddress, country: 'USA' });
      }).toThrow();
    });
  });

  describe('CheckoutSchema', () => {
    const validCheckout = {
      items: [
        { productId: 'clx12345678901234567890', quantity: 2 },
      ],
      address: {
        email: 'test@example.com',
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
      },
    };

    it('validates valid checkout payload', () => {
      expect(CheckoutSchema.parse(validCheckout)).toEqual(validCheckout);
    });

    it('rejects empty items array', () => {
      expect(() => {
        CheckoutSchema.parse({ ...validCheckout, items: [] });
      }).toThrow();
    });

    it('rejects invalid address', () => {
      expect(() => {
        CheckoutSchema.parse({
          ...validCheckout,
          address: { ...validCheckout.address, email: 'invalid' },
        });
      }).toThrow();
    });
  });
});

