'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Price from './Price';
import AddToCart from './AddToCart';

export default function ProductCard({
  p,
  index = 0,
}: {
  p: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    unitAmount: number;
    currency: string;
  };
  index?: number;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [imgError, setImgError] = useState(false);

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
              ease: 'easeOut',
              delay: index * 0.05, // Stagger animation
            }
      }
      whileHover={reducedMotion ? {} : { y: -4 }}
      className="rounded-lg border border-white/10 bg-white/5 p-4 transition-shadow hover:shadow-lg hover:shadow-cyan-500/10"
    >
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-md">
          {imgError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          ) : (
            <Image
              src={p.imageUrl}
              alt={p.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width:768px) 100vw, 33vw"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <h3 className="mb-1 text-sm font-medium">{p.name}</h3>
      </Link>
      <div className="mb-3 text-cyan-300">
        <Price amount={p.unitAmount} currency={p.currency} />
      </div>
      <AddToCart productId={p.id} />
    </motion.div>
  );
}
