'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type Address } from '@/lib/validation';
import { getCart, saveEmail, getStoredEmail } from '@/lib/cart';
import { total } from '@/lib/cart';
import { routes } from '@/lib/routes';
import Price from '@/components/Price';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';
import AddressForm from '@/components/AddressForm';

interface Product {
  id: string;
  name: string;
  unitAmount: number;
  currency: string;
  imageUrl: string;
  slug: string;
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState(getCart());
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState<Address | null>(null);
  const storedEmail = getStoredEmail();

  useEffect(() => {
    if (cartItems.length === 0) {
      setLoading(false);
      return;
    }

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

  const handleAddressSubmit = (address: Address) => {
    setFormData(address);
    // Save email to localStorage
    saveEmail(address.email);
    // TODO: Submit to /api/checkout will use formData
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;

    // TODO: Submit to /api/checkout
    console.log('Checkout submitted:', { items: cartItems, address: formData });
  };

  const subtotal = total(
    cartItems,
    new Map(
      Array.from(products.entries()).map(([id, p]) => [id, { unitAmount: p.unitAmount, currency: p.currency }])
    )
  );

  const currency = cartItems.length > 0 && products.size > 0 ? Array.from(products.values())[0]?.currency || 'usd' : 'usd';

  if (loading) {
    return <Loading />;
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            title="Your cart is empty"
            message="Add some products before checking out."
          />
          <div className="text-center mt-8">
            <Link
              href={routes.home}
              className="inline-block px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-300 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Address Form */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Shipping Information</h2>
            <AddressForm
              defaultEmail={storedEmail || ''}
              onSubmit={handleAddressSubmit}
              onValidityChange={setIsFormValid}
            />
          </div>

          {/* Order Summary */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Order Summary</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
              {/* Cart Items */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cartItems.map((item) => {
                  const product = products.get(item.productId);
                  if (!product) return null;

                  return (
                    <div key={item.productId} className="flex gap-4">
                      <Link
                        href={routes.product(product.slug)}
                        className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden"
                      >
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={routes.product(product.slug)}
                          className="block text-cyan-300 font-semibold hover:text-cyan-200 mb-1 truncate"
                        >
                          {product.name}
                        </Link>
                        <div className="text-slate-400 text-sm">
                          Qty: {item.quantity} × <Price unitAmount={product.unitAmount} currency={product.currency} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal */}
              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="flex justify-between items-center text-xl mb-6">
                  <span className="text-slate-400">Subtotal:</span>
                  <Price unitAmount={subtotal} currency={currency} className="text-cyan-300" />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleFinalSubmit}
                  disabled={!isFormValid}
                  className="w-full px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 active:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
