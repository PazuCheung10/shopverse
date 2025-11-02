import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';

export const revalidate = 60;

export default async function HomePage() {
  let products;
  try {
    products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Database error:', error);
    // Return empty array if database is not connected
    products = [];
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="Database Not Connected"
        message="Please set up your DATABASE_URL in .env.local. See README.md for instructions."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
