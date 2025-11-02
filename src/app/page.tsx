import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import SearchBar from '@/components/SearchBar';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import { Suspense } from 'react';

export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

async function ProductGrid({ page = 1, searchQuery }: { page: number; searchQuery?: string }) {
  const limit = 12;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { active: true };
  
  if (searchQuery?.trim()) {
    where.OR = [
      { name: { contains: searchQuery.trim(), mode: 'insensitive' } },
      { description: { contains: searchQuery.trim(), mode: 'insensitive' } },
    ];
  }

  let products, total;
  try {
    [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
  } catch (error) {
    console.error('Database error:', error);
    return (
      <EmptyState
        title="Database Not Connected"
        message="Please set up your DATABASE_URL in .env.local. See README.md for instructions."
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        message={searchQuery ? `No products match "${searchQuery}"` : 'No products available.'}
      />
    );
  }

  const hasMore = skip + products.length < total;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p, index) => (
          <ProductCard key={p.id} p={p} index={index} />
        ))}
      </div>
      <Pagination
        page={page}
        limit={limit}
        total={total}
        hasMore={hasMore}
      />
    </>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const searchQuery = params.q;

  return (
    <>
      <SearchBar />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid page={page} searchQuery={searchQuery} />
      </Suspense>
    </>
  );
}
