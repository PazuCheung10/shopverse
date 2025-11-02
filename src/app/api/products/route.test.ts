import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('?ids= query param (cart compatibility)', () => {
    it('returns products by IDs', async () => {
      const mockProducts = [
        { id: 'prod1', name: 'Product 1', active: true },
        { id: 'prod2', name: 'Product 2', active: true },
      ];

      (prisma.product.findMany as any).mockResolvedValue(mockProducts);

      const req = new NextRequest('http://localhost:3001/api/products?ids=prod1,prod2');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ products: mockProducts });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['prod1', 'prod2'] },
          active: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters out empty IDs', async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products?ids=prod1,,prod2,');
      await GET(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['prod1', 'prod2'] },
          active: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      (prisma.product.count as any).mockResolvedValue(25);
    });

    it('returns paginated results with defaults', async () => {
      const mockProducts = Array.from({ length: 12 }, (_, i) => ({
        id: `prod${i}`,
        name: `Product ${i}`,
      }));

      (prisma.product.findMany as any).mockResolvedValue(mockProducts);

      const req = new NextRequest('http://localhost:3001/api/products');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        products: mockProducts,
        page: 1,
        limit: 12,
        total: 25,
        hasMore: true,
      });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0,
        take: 12,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('handles custom page and limit', async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products?page=2&limit=5');
      const response = await GET(req);
      const data = await response.json();

      expect(data.page).toBe(2);
      expect(data.limit).toBe(5);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 5, // (2-1) * 5
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('enforces max limit of 50', async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products?limit=100');
      await GET(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0,
        take: 50, // Capped at 50
        orderBy: { createdAt: 'desc' },
      });
    });

    it('enforces min limit of 1', async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products?limit=0');
      await GET(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0,
        take: 1, // Enforced minimum
        orderBy: { createdAt: 'desc' },
      });
    });

    it('handles invalid page number', async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products?page=-1');
      await GET(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0, // Math.max(1, -1) = 1, so (1-1) * 12 = 0
        take: 12,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('calculates hasMore correctly', async () => {
      (prisma.product.count as any).mockResolvedValue(12);
      (prisma.product.findMany as any).mockResolvedValue(
        Array.from({ length: 12 }, (_, i) => ({ id: `prod${i}` }))
      );

      const req = new NextRequest('http://localhost:3001/api/products?page=1&limit=12');
      const response = await GET(req);
      const data = await response.json();

      expect(data.hasMore).toBe(false); // 12 items, page 1, limit 12 = no more
    });
  });

  describe('search (q param)', () => {
    it('searches by name', async () => {
      (prisma.product.count as any).mockResolvedValue(1);
      (prisma.product.findMany as any).mockResolvedValue([
        { id: 'prod1', name: 'Headphones' },
      ]);

      const req = new NextRequest('http://localhost:3001/api/products?q=headphones');
      await GET(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          OR: [
            { name: { contains: 'headphones', mode: 'insensitive' } },
            { description: { contains: 'headphones', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 12,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('searches by description', async () => {
      (prisma.product.count as any).mockResolvedValue(2);
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products?q=wireless');
      await GET(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          OR: [
            { name: { contains: 'wireless', mode: 'insensitive' } },
            { description: { contains: 'wireless', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 12,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('trims search query', async () => {
      (prisma.product.count as any).mockResolvedValue(0);
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products?q=  test  ');
      await GET(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 12,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('works without search query', async () => {
      (prisma.product.count as any).mockResolvedValue(10);
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products');
      await GET(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0,
        take: 12,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('combined pagination and search', () => {
    it('combines search with pagination', async () => {
      (prisma.product.count as any).mockResolvedValue(5);
      (prisma.product.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3001/api/products?q=bag&page=2&limit=3');
      const response = await GET(req);
      const data = await response.json();

      expect(data.page).toBe(2);
      expect(data.limit).toBe(3);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          OR: [
            { name: { contains: 'bag', mode: 'insensitive' } },
            { description: { contains: 'bag', mode: 'insensitive' } },
          ],
        },
        skip: 3,
        take: 3,
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});

