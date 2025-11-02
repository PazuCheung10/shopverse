import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const ids = searchParams.get('ids');

  // If ids param is present, use existing behavior (for cart compatibility)
  if (ids) {
    const list = ids.split(',').filter(Boolean);
    const products = await prisma.product.findMany({ 
      where: { 
        id: { in: list },
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  }

  // Pagination and search
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limitRaw = parseInt(searchParams.get('limit') || '12', 10);
  const limit = Math.min(50, Math.max(1, limitRaw)); // max 50, min 1
  const skip = (page - 1) * limit;
  const searchQuery = searchParams.get('q')?.trim();

  // Build where clause
  const where: any = { active: true };
  
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Fetch products and total count in parallel
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  const hasMore = skip + products.length < total;

  return NextResponse.json({
    products,
    page,
    limit,
    total,
    hasMore,
  });
}
