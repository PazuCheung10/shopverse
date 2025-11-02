'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const raw = localStorage.getItem('shopverse:cart');
      if (raw) {
        try {
          const items = JSON.parse(raw) as { productId: string; quantity: number }[];
          setCount(items.reduce((s, i) => s + i.quantity, 0));
        } catch {
          setCount(0);
        }
      } else {
        setCount(0);
      }
    };

    // Initial load
    updateCount();

    // Listen for storage events (cross-tab changes)
    const onStorage = () => {
      updateCount();
    };

    // Listen for custom cartUpdated events (same-tab changes)
    const onCartUpdated = () => {
      updateCount();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('cartUpdated', onCartUpdated);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cartUpdated', onCartUpdated);
    };
  }, []);

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-cyan-300 hover:text-cyan-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded">
          ShopVerse
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-slate-300 hover:text-cyan-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded px-2 py-1"
          >
            Catalog
          </Link>
          <Link
            href="/cart"
            className="text-slate-300 hover:text-cyan-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded px-2 py-1"
          >
            Cart ({count})
          </Link>
        </nav>
      </div>
    </header>
  );
}

