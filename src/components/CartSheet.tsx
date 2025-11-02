'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getCart, updateQty, removeItem, total } from '@/lib/cart';
import { routes } from '@/lib/routes';
import Price from './Price';
import EmptyState from './EmptyState';
import { formatPrice } from '@/lib/currency';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  unitAmount: number;
  currency: string;
  imageUrl: string;
  slug: string;
}

export default function CartSheet({ isOpen, onClose }: CartSheetProps) {
  const [cartItems, setCartItems] = useState(getCart());
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Fetch product data for cart items
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/products');
          const allProducts: Product[] = await response.json();
          const productMap = new Map<string, Product>();
          allProducts.forEach((p) => productMap.set(p.id, p));
          setProducts(productMap);
        } catch (error) {
          console.error('Failed to fetch products:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
      setCartItems(getCart());
    }
  }, [isOpen]);

  const handleQtyChange = (productId: string, newQty: number) => {
    updateQty(productId, newQty);
    setCartItems(getCart());
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
    setCartItems(getCart());
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = total(
    cartItems,
    new Map(
      Array.from(products.entries()).map(([id, p]) => [id, { unitAmount: p.unitAmount, currency: p.currency }])
    )
  );

  const currency = cartItems.length > 0 && products.size > 0 ? Array.from(products.values())[0]?.currency || 'usd' : 'usd';

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0 }}
            animate={reducedMotion ? {} : { opacity: 1 }}
            exit={reducedMotion ? {} : { opacity: 0 }}
            transition={reducedMotion ? {} : { duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={reducedMotion ? {} : { x: '100%' }}
            animate={reducedMotion ? {} : { x: 0 }}
            exit={reducedMotion ? {} : { x: '100%' }}
            transition={
              reducedMotion
                ? {}
                : {
                    type: 'spring',
                    damping: 30,
                    stiffness: 300,
                  }
            }
            className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 z-50 shadow-xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 id="cart-title" className="text-2xl font-bold text-cyan-300">
            Cart
          </h2>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading...</div>
          ) : cartItems.length === 0 ? (
            <EmptyState title="Your cart is empty" message="Add some products to get started!" />
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const product = products.get(item.productId);
                if (!product) return null;

                return (
                  <div key={item.productId} className="flex gap-4 bg-white/5 rounded-lg p-4">
                    <Link
                      href={routes.product(product.slug)}
                      onClick={onClose}
                      className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden"
                    >
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={routes.product(product.slug)}
                        onClick={onClose}
                        className="block text-cyan-300 font-semibold hover:text-cyan-200 mb-1 truncate"
                      >
                        {product.name}
                      </Link>
                      <div className="text-slate-400 text-sm mb-2">
                        <Price amount={product.unitAmount} currency={product.currency} />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`qty-${item.productId}`}>
                          Quantity
                        </label>
                        <button
                          onClick={() => handleQtyChange(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                          aria-label={`Decrease quantity of ${product.name}`}
                        >
                          -
                        </button>
                        <input
                          id={`qty-${item.productId}`}
                          type="number"
                          min="1"
                          max="10"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 1)}
                          className="w-12 text-center bg-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                          aria-label={`Quantity of ${product.name}`}
                        />
                        <button
                          onClick={() => handleQtyChange(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                          aria-label={`Increase quantity of ${product.name}`}
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="ml-auto text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && !loading && (
          <div className="border-t border-slate-700 p-4 space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-slate-400">Subtotal:</span>
              <span className="text-2xl text-cyan-300">
                <Price amount={subtotal} currency={currency} />
              </span>
            </div>
            <Link
              href={routes.checkout}
              onClick={onClose}
              className="block w-full px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 active:bg-cyan-500 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Go to Checkout
            </Link>
          </div>
        )}
      </motion.div>
    </>
      )}
    </AnimatePresence>
  );
}
