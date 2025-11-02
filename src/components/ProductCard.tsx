'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
  index?: number;
}

export default function ProductCard({
  slug,
  name,
  description,
  imageUrl,
  unitAmount,
  currency,
  index = 0,
}: ProductCardProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? {}
          : {
              duration: 0.3,
              delay: index * 0.05,
              ease: 'easeOut',
            }
      }
      whileHover={reducedMotion ? {} : { y: -4 }}
      className="h-full"
    >
      <Link
        href={routes.product(slug)}
        className="group block bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/15 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 h-full flex flex-col"
        aria-label={`View ${name} product details`}
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
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-cyan-300 mb-2 group-hover:text-cyan-200 transition-colors">
            {name}
          </h3>
          <p className="text-slate-300 text-sm mb-4 line-clamp-2">{description}</p>
          <div className="mt-auto">
            <Price unitAmount={unitAmount} currency={currency} className="text-cyan-300" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
