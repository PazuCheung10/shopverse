'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { clearCart } from '@/lib/cart';
import { routes } from '@/lib/routes';
import Price from '@/components/Price';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';
import { maskAddress, maskEmail } from '@/lib/mask';

interface OrderItem {
  id: string;
  quantity: number;
  unitAmount: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    slug: string;
  };
}

interface Order {
  id: string;
  email: string;
  name: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  currency: string;
  subtotal: number;
  total: number;
  status: string;
  items: OrderItem[];
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCleared, setCartCleared] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('Missing session ID');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/session/${sessionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const orderData: Order = await response.json();
        setOrder(orderData);

        // Clear cart only after confirming order is PAID
        if (orderData.status === 'PAID' && !cartCleared) {
          clearCart();
          setCartCleared(true);
          // Dispatch event to update cart count in header
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId, cartCleared]);

  if (loading) {
    return <Loading />;
  }

  if (error || !order) {
    return (
      <>
        <ErrorState
          title="Order Not Found"
          message={error || 'Unable to retrieve order details. Please contact support if this persists.'}
        />
        <div className="text-center mt-8">
          <Link
            href={routes.home}
            className="inline-block px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Success Header */}
      <div className="text-center mb-8">
          <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
            <svg
              className="w-16 h-16 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-green-400 mb-2">Payment Successful!</h1>
          <p className="text-slate-400">Your order has been confirmed</p>
        </div>

        {/* Receipt Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-6">Order Receipt</h2>

          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Order ID</h3>
              <p className="text-white font-mono text-sm">{order.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Email</h3>
              <p className="text-white">{maskEmail(order.email)}</p>
            </div>
          </div>

          {/* Shipping Address (Masked) */}
          {(order.addressLine1 || order.city) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Shipping Address</h3>
              <div className="text-white">
                {order.name && <p>{order.name}</p>}
                {order.addressLine1 && <p>{maskAddress(order.addressLine1)}</p>}
                {order.addressLine2 && <p>{order.addressLine2}</p>}
                <p>
                  {order.city}
                  {order.state && `, ${order.state}`}
                  {order.postalCode && ` ${order.postalCode}`}
                </p>
                {order.country && <p>{order.country}</p>}
              </div>
            </div>
          )}

          {/* Order Items */}
          {order.items && order.items.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <Link
                      href={routes.product(item.product.slug)}
                      className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden"
                    >
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link
                        href={routes.product(item.product.slug)}
                        className="text-cyan-300 font-semibold hover:text-cyan-200"
                      >
                        {item.product.name}
                      </Link>
                      <div className="text-slate-400 text-sm mt-1">
                        Quantity: {item.quantity} × <Price amount={item.unitAmount} currency={order.currency} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
              <p className="text-slate-400">Items details will be available shortly.</p>
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">Subtotal:</span>
              <span className="text-white">
                <Price amount={order.subtotal} currency={order.currency} />
              </span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-cyan-300">Total:</span>
              <span className="text-cyan-300">
                <Price amount={order.total} currency={order.currency} />
              </span>
            </div>
          </div>
        </div>

      {/* Actions */}
      <div className="text-center">
        <Link
          href={routes.home}
          className="inline-block px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 transition-colors mr-4"
        >
          Continue Shopping
        </Link>
      </div>
    </>
  );
}
