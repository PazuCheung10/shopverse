import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { maskEmail, maskAddress } from '@/lib/mask';
import SuccessReceipt from '@/components/SuccessReceipt';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function findOrderWithPolling(sessionId: string) {
  // Try to find order immediately (with items from DB)
  let order = await prisma.order.findUnique({
    where: { stripePaymentId: sessionId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // If not found or items not yet persisted, poll up to 6 times (3 seconds max)
  // Prefer DB items - faster than Stripe API calls
  if (!order || order.items.length === 0) {
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      order = await prisma.order.findUnique({
        where: { stripePaymentId: sessionId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      // Stop polling once we have order with items
      if (order && order.items.length > 0) break;
    }
  }

  return order;
}

async function fetchStripeLineItems(sessionId: string) {
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
    });
    return lineItems.data.map((item) => ({
      name: item.description || item.price?.product?.toString() || 'Unknown product',
      quantity: item.quantity || 1,
      amount: item.amount_total || 0,
      currency: item.currency || 'usd',
    }));
  } catch (error) {
    console.error('Failed to fetch Stripe line items:', error);
    return null;
  }
}

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-block p-4 bg-red-500/20 rounded-full">
          <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-red-400">Session ID missing</h1>
        <p className="text-slate-400">Please complete checkout to view your receipt.</p>
        <div className="pt-4">
          <Link href="/" className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // Poll for order (waits up to 3s for webhook to persist)
  const order = await findOrderWithPolling(sessionId);

  if (!order) {
    // If order still not found, try to fetch from Stripe as fallback
    const lineItems = await fetchStripeLineItems(sessionId);
    if (!lineItems) {
      return (
        <div className="text-center space-y-6">
          <div className="inline-block p-4 bg-yellow-500/20 rounded-full">
            <svg className="w-16 h-16 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-yellow-400">Order processing</h1>
          <p className="text-slate-400">Your payment was received. The order is being processed.</p>
          <p className="text-sm text-slate-500">Session: {sessionId.slice(0, 8)}...</p>
          <div className="pt-4">
            <Link href="/" className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400">
              Continue shopping
            </Link>
          </div>
        </div>
      );
    }

    // Show receipt from Stripe data (no order in DB yet)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
            <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-green-400 mb-2">Payment received</h1>
          <p className="text-slate-400">Order is being processed</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Receipt</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Session ID:</span>
              <span className="font-mono text-xs">{sessionId.slice(0, 20)}...</span>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-medium mb-2">Items</h3>
            <ul className="space-y-2">
              {lineItems.map((item, idx) => (
                <li key={idx} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: item.currency.toUpperCase(),
                    }).format(item.amount / 100)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500 pt-4">Full receipt details will be available once order processing completes.</p>
        </div>
        <div className="flex justify-center">
          <Link href="/" className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // Clear cart only if order is PAID (client-side will handle this)
  return <SuccessReceipt order={order} sessionId={sessionId} />;
}
