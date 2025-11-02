import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids');
  if (!ids) return NextResponse.json({ products: [] });

  const list = ids.split(',').filter(Boolean);
  const products = await prisma.product.findMany({ where: { id: { in: list } } });
  return NextResponse.json({ products });
}
