'use client';

import Image from 'next/image';
import { useState } from 'react';
import Price from '@/components/Price';
import AddToCart from '@/components/AddToCart';

interface ProductContentProps {
  p: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string;
    unitAmount: number;
    currency: string;
  };
}

export function ProductContent({ p }: ProductContentProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
        {imgError ? (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex items-center justify-center">
            <svg
              className="w-24 h-24 text-slate-400"
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
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div>
        <h1 className="mb-2 text-2xl font-semibold">{p.name}</h1>
        <div className="mb-4 text-cyan-300">
          <Price amount={p.unitAmount} currency={p.currency} />
        </div>
        <p className="mb-6 text-slate-300">{p.description}</p>
        <AddToCart productId={p.id} />
      </div>
    </div>
  );
}

