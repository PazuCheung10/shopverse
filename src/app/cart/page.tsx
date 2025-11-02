'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCart, updateQty, removeItem, total } from '@/lib/cart';
import { routes } from '@/lib/routes';
import Price from '@/components/Price';
import EmptyState from '@/components/EmptyState';
import { formatPrice } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  unitAmount: number;
  currency: string;
  imageUrl: string;
  slug: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState(getCart());
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    // Sync cart on mount and listen for storage changes
    const handleStorageChange = () => {
      setCartItems(getCart());
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  return (
    <>
      <div>
        <h1 className="text-4xl font-bold text-cyan-300 mb-8">Shopping Cart</h1>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading...</div>
        ) : cartItems.length === 0 ? (
          <EmptyState title="Your cart is empty" message="Add some products to get started!" />
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cartItems.map((item) => {
                const product = products.get(item.productId);
                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="flex gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4"
                  >
                    <Link
                      href={routes.product(product.slug)}
                      className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden"
                    >
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={routes.product(product.slug)}
                        className="block text-xl text-cyan-300 font-semibold hover:text-cyan-200 mb-2"
                      >
                        {product.name}
                      </Link>
                      <div className="text-slate-400 mb-4">
                        <Price amount={product.unitAmount} currency={product.currency} />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`qty-${item.productId}`}>
                          Quantity
                        </label>
                        <button
                          onClick={() => handleQtyChange(item.productId, item.quantity - 1)}
                          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                          aria-label="Decrease quantity"
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
                          className="w-16 text-center bg-white/10 rounded px-2 py-1 text-white"
                        />
                        <button
                          onClick={() => handleQtyChange(item.productId, item.quantity + 1)}
                          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="ml-auto px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
                          aria-label="Remove item"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex justify-between items-center text-2xl mb-6">
                <span className="text-slate-400">Subtotal:</span>
                <span className="text-cyan-300">
                  <Price amount={subtotal} currency={currency} />
                </span>
              </div>
              <Link
                href={routes.checkout}
                className="block w-full px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 text-center transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
