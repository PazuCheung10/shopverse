import Link from 'next/link';
import Image from 'next/image';
import Price from './Price';
import { routes } from '@/lib/routes';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  unitAmount: number;
  currency: string;
}

export default function ProductCard({
  slug,
  name,
  description,
  imageUrl,
  unitAmount,
  currency,
}: ProductCardProps) {
  return (
    <Link
      href={routes.product(slug)}
      className="group block bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/15 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-cyan-300 mb-2 group-hover:text-cyan-200 transition-colors">
          {name}
        </h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{description}</p>
        <Price unitAmount={unitAmount} currency={currency} className="text-cyan-300" />
      </div>
    </Link>
  );
}
