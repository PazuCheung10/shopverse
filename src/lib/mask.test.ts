import { describe, it, expect } from 'vitest';
import { maskEmail, maskAddress } from './mask';

describe('mask.ts', () => {
  describe('maskEmail', () => {
    it('masks email correctly', () => {
      expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com');
      expect(maskEmail('test@domain.com')).toBe('te***@domain.com');
    });

    it('handles short local part', () => {
      expect(maskEmail('ab@example.com')).toBe('ab@example.com'); // <= 2 chars, no mask
    });

    it('handles missing domain', () => {
      expect(maskEmail('invalid-email')).toBe('invalid-email');
    });

    it('handles empty/null/undefined', () => {
      expect(maskEmail('')).toBe('N/A');
      expect(maskEmail(null as any)).toBe('N/A');
      expect(maskEmail(undefined as any)).toBe('N/A');
    });
  });

  describe('maskAddress', () => {
    it('masks address correctly', () => {
      expect(maskAddress('123 Main Street')).toBe('****reet'); // Last 4 chars: 'reet'
      expect(maskAddress('456 Oak Avenue')).toBe('****enue'); // Last 4 chars: 'enue' (from 'Avenue')
    });

    it('handles short addresses', () => {
      expect(maskAddress('1234')).toBe('1234'); // <= 4 chars, no mask
      expect(maskAddress('123')).toBe('123');
    });

    it('handles empty/null/undefined', () => {
      expect(maskAddress('')).toBe('N/A');
      expect(maskAddress(null as any)).toBe('N/A');
      expect(maskAddress(undefined as any)).toBe('N/A');
    });
  });
});

