'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Image from 'next/image';

type Item = { productId: string; quantity: number };

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json());

export default function CartPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadCart = () => {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('shopverse:cart') : null;
      setItems(raw ? JSON.parse(raw) : []);
    };
    loadCart();
    window.addEventListener('storage', loadCart);
    window.addEventListener('cartUpdated', loadCart);
    return () => {
      window.removeEventListener('storage', loadCart);
      window.removeEventListener('cartUpdated', loadCart);
    };
  }, []);

  const ids = items.map((i) => i.productId).join(',');
  const { data } = useSWR(ids ? `/api/products?ids=${ids}` : null, fetcher);
  const products: any[] = data?.products ?? [];

  const updateQty = (productId: string, delta: number) => {
    const raw = localStorage.getItem('shopverse:cart');
    const current: Item[] = raw ? JSON.parse(raw) : [];
    const item = current.find((i) => i.productId === productId);
    if (item) {
      item.quantity = Math.max(1, Math.min(10, item.quantity + delta));
      if (item.quantity === 0) {
        current.splice(current.indexOf(item), 1);
      }
    } else if (delta > 0) {
      current.push({ productId, quantity: 1 });
    }
    localStorage.setItem('shopverse:cart', JSON.stringify(current));
    setItems(current);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const remove = (productId: string) => {
    const raw = localStorage.getItem('shopverse:cart');
    const current: Item[] = raw ? JSON.parse(raw) : [];
    const updated = current.filter((i) => i.productId !== productId);
    localStorage.setItem('shopverse:cart', JSON.stringify(updated));
    setItems(updated);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = items.reduce((sum, i) => {
    const p = products.find((p) => p.id === i.productId);
    return sum + (p?.unitAmount ?? 0) * i.quantity;
  }, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Your cart</h1>
      {!items.length ? (
        <p>
          Cart is empty. <Link className="text-cyan-300" href="/">Browse products</Link>
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((i) => {
              const p = products.find((p) => p.id === i.productId);
              return (
                <li key={i.productId} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-cyan-500/20 transition-all">
                  {/* Product image */}
                  <div className="relative w-16 h-16 flex-shrink-0 rounded border border-white/10 overflow-hidden">
                    {!p ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-slate-400"
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
                    ) : imageErrors.has(i.productId) ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-slate-400"
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
                        sizes="64px"
                        onError={() => {
                          setImageErrors((prev) => new Set(prev).add(i.productId));
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{p?.name ?? 'Loading...'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(i.productId, -1)}
                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 hover:border border-white/20 flex items-center justify-center text-sm font-semibold transition-all"
                      >
                        −
                      </button>
                      <span className="text-sm text-slate-300 min-w-[2ch] text-center font-medium">Qty: {i.quantity}</span>
                      <button
                        onClick={() => updateQty(i.productId, 1)}
                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 hover:border border-white/20 flex items-center justify-center text-sm font-semibold transition-all"
                      >
                        +
                      </button>
                      <button
                        onClick={() => remove(i.productId)}
                        className="ml-4 text-sm text-red-400 hover:text-red-300 font-medium underline decoration-red-400/50 hover:decoration-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-cyan-300 ml-4">
                    {p
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: p.currency.toUpperCase(),
                        }).format((p.unitAmount * i.quantity) / 100)
                      : '—'}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-slate-400">Total</span>
            <span className="text-lg text-cyan-300">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal / 100)}
            </span>
          </div>
          <div className="flex justify-end">
            <Link
              href="/checkout"
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3 font-semibold text-slate-950 hover:from-cyan-400 hover:to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue to checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
