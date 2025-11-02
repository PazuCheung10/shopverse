import { getProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-cyan-300 mb-4">ShopVerse</h1>
          <p className="text-slate-400 text-lg">Discover our curated collection</p>
        </div>

        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                description={product.description}
                imageUrl={product.imageUrl}
                unitAmount={product.unitAmount}
                currency={product.currency}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
