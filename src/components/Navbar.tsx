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
    <header className="sticky top-0 z-[9999] isolate site-header">
      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent hover:from-cyan-200 hover:to-cyan-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded">
            ShopVerse
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-slate-300 hover:text-cyan-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded px-3 py-1.5"
            >
              Catalog
            </Link>
            <Link
              href="/cart"
              className="relative text-slate-300 hover:text-cyan-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded px-3 py-1.5"
            >
              Cart
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

