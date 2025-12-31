'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCart } from '@/lib/cart';
import { routes } from '@/lib/routes';
import CartSheet from './CartSheet';

export default function Header() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = getCart();
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // Listen for custom cart update events
    window.addEventListener('cartUpdated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    // Update count when cart opens/closes
    if (cartOpen) {
      const cart = getCart();
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    }
  }, [cartOpen]);

  return (
    <>
      <header className="sticky top-0 z-[9999] isolate site-header">
        <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href={routes.home} className="text-2xl font-bold text-cyan-300 hover:text-cyan-200 transition-colors">
              ShopVerse
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href={routes.home}
                className="text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1"
              >
                Products
              </Link>
              <button
                onClick={() => setCartOpen(true)}
                className="relative text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
                aria-label={`Open cart${cartCount > 0 ? ` with ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-cyan-400 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>
      <CartSheet isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

