import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products';
import ProductGallery from '@/components/ProductGallery';
import Price from '@/components/Price';
import AddToCart from '@/components/AddToCart';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div>
            <ProductGallery imageUrl={product.imageUrl} name={product.name} />
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-cyan-300 mb-4">{product.name}</h1>
            
            <div className="mb-6">
              <Price
                unitAmount={product.unitAmount}
                currency={product.currency}
                className="text-3xl text-cyan-300"
              />
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
              <p className="text-slate-300 leading-relaxed">{product.description}</p>
            </div>

            <div className="mt-auto">
              <AddToCart productId={product.id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
