import Link from 'next/link';
import Image from 'next/image';
import Price from './Price';
import AddToCart from './AddToCart';

export default function ProductCard({
  p,
}: {
  p: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    unitAmount: number;
    currency: string;
  };
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-md">
          <Image
            src={p.imageUrl}
            alt={p.name}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </div>
        <h3 className="mb-1 text-sm font-medium">{p.name}</h3>
      </Link>
      <div className="mb-3 text-cyan-300">
        <Price amount={p.unitAmount} currency={p.currency} />
      </div>
      <AddToCart productId={p.id} />
    </div>
  );
}
