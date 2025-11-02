'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { maskEmail, maskAddress } from '@/lib/mask';
import type { Order, OrderItem, Product } from '@prisma/client';

interface OrderWithItems extends Order {
  items: Array<
    OrderItem & {
      product: Product;
    }
  >;
}

interface SuccessReceiptProps {
  order: OrderWithItems;
  sessionId: string;
}

export default function SuccessReceipt({ order, sessionId }: SuccessReceiptProps) {
  // Clear cart once order is confirmed PAID
  useEffect(() => {
    if (order.status === 'PAID') {
      localStorage.removeItem('shopverse:cart');
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, [order.status]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
          <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-green-400 mb-2">Payment received</h1>
        <p className="text-slate-400">Thank you for your purchase!</p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Order Receipt</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Order ID:</span>
              <span className="font-mono">{order.id.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-green-400 font-medium">{order.status}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h3 className="font-medium mb-3">Customer Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-400">Email: </span>
              <span>{maskEmail(order.email)}</span>
            </div>
            {order.name && (
              <div>
                <span className="text-slate-400">Name: </span>
                <span>{order.name}</span>
              </div>
            )}
            {(order.addressLine1 || order.city || order.postalCode) && (
              <div>
                <span className="text-slate-400">Address: </span>
                <span>
                  {maskAddress(order.addressLine1)}
                  {order.addressLine2 && `, ${maskAddress(order.addressLine2)}`}
                  {order.city && `, ${order.city}`}
                  {order.state && `, ${order.state}`}
                  {order.postalCode && ` ${order.postalCode}`}
                  {order.country && `, ${order.country.toUpperCase()}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h3 className="font-medium mb-3">Order Items</h3>
          {order.items.length > 0 ? (
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-sm text-slate-400">Quantity: {item.quantity}</div>
                  </div>
                  <div className="text-cyan-300 ml-4">
                    {formatCurrency(item.unitAmount * item.quantity, order.currency)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Items are being processed...</p>
          )}
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal:</span>
            <span>{formatCurrency(order.subtotal, order.currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span className="text-cyan-300">{formatCurrency(order.total, order.currency)}</span>
          </div>
          <div className="text-xs text-slate-500 pt-2">
            Currency: {order.currency.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Link href="/" className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

