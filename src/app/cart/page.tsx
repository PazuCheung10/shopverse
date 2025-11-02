'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';

type Item = { productId: string; quantity: number };

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json());

export default function CartPage() {
  const [items, setItems] = useState<Item[]>([]);

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
                <li key={i.productId} className="flex items-center justify-between rounded border border-white/10 p-3">
                  <div className="flex-1">
                    <div className="font-medium">{p?.name ?? 'Loading...'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(i.productId, -1)}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm"
                      >
                        −
                      </button>
                      <span className="text-sm text-slate-400 min-w-[2ch] text-center">Qty: {i.quantity}</span>
                      <button
                        onClick={() => updateQty(i.productId, 1)}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                      <button
                        onClick={() => remove(i.productId)}
                        className="ml-4 text-sm text-red-400 hover:text-red-300"
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
            <span className="text-slate-400">Subtotal</span>
            <span className="text-lg text-cyan-300">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal / 100)}
            </span>
          </div>
          <div className="flex justify-end">
            <Link
              href="/checkout"
              className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400"
            >
              Continue to checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
