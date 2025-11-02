'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressSchema } from '@/lib/validation';
import { z } from 'zod';
import { getStoredEmail } from '@/lib/cart';
import { useToast } from '@/lib/useToast';
import Link from 'next/link';
import ErrorState from '@/components/ErrorState';

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
  const toast = useToast();

  const form = useForm<z.infer<typeof AddressSchema>>({
    resolver: zodResolver(AddressSchema),
    defaultValues: {
      email: typeof window !== 'undefined' ? getStoredEmail() || '' : '',
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
    mode: 'onChange',
  });

  // Load cart items
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('shopverse:cart') : null;
    setItems(raw ? JSON.parse(raw) : []);
  }, []);

  // Cart validation: remove unavailable products on mount (run once after items load)
  useEffect(() => {
    if (!items.length) return;

    let mounted = true;

    const validateCart = async () => {
      try {
        const ids = items.map((i) => i.productId).join(',');
        const r = await fetch(`/api/products?ids=${ids}`);
        const { products } = await r.json();
        const valid = new Set(products.map((p: any) => p.id));
        const cleaned = items.filter((i) => valid.has(i.productId));

        if (!mounted) return;

        if (cleaned.length !== items.length) {
          localStorage.setItem('shopverse:cart', JSON.stringify(cleaned));
          setItems(cleaned);
          window.dispatchEvent(new Event('cartUpdated'));
          toast.push({
            variant: 'info',
            title: 'Cart updated',
            message: `Removed ${items.length - cleaned.length} unavailable item(s).`,
          });
        }
      } catch (error) {
        console.error('Cart validation error:', error);
      }
    };

    validateCart();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount after items are loaded

  const onSubmit = async (address: z.infer<typeof AddressSchema>) => {
    setIsSubmitting(true);
    setErr(null);

    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('shopverse:cart') : null;
      const items = raw ? JSON.parse(raw) : [];

      if (!items.length) {
        throw new Error('Your cart is empty.');
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Checkout failed.');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Something went wrong.';
      setErr(msg);
      toast.push({
        variant: 'error',
        title: 'Checkout error',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <p className="text-slate-400">
          Cart is empty. <Link className="text-cyan-300 hover:text-cyan-200" href="/">Browse products</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h1 className="text-xl font-semibold">Checkout</h1>

        {err && (
          <div className="mb-4">
            <ErrorState message={err} />
          </div>
        )}
        
        <div>
          <input
            placeholder="Email"
            {...form.register('email')}
            className="w-full rounded bg-white/10 border border-white/20 p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-sm text-red-400">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            placeholder="Name"
            {...form.register('name')}
            className="w-full rounded bg-white/10 border border-white/20 p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-sm text-red-400">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <input
            placeholder="Address line 1"
            {...form.register('addressLine1')}
            className="w-full rounded bg-white/10 border border-white/20 p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {form.formState.errors.addressLine1 && (
            <p className="mt-1 text-sm text-red-400">{form.formState.errors.addressLine1.message}</p>
          )}
        </div>

        <div>
          <input
            placeholder="Address line 2 (optional)"
            {...form.register('addressLine2')}
            className="w-full rounded bg-white/10 border border-white/20 p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {form.formState.errors.addressLine2 && (
            <p className="mt-1 text-sm text-red-400">{form.formState.errors.addressLine2.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              placeholder="City"
              {...form.register('city')}
              className="w-full rounded bg-white/10 border border-white/20 p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {form.formState.errors.city && (
              <p className="mt-1 text-sm text-red-400">{form.formState.errors.city.message}</p>
            )}
          </div>
          <div>
            <input
              placeholder="State (optional)"
              {...form.register('state')}
              className="w-full rounded bg-white/10 border border-white/20 p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {form.formState.errors.state && (
              <p className="mt-1 text-sm text-red-400">{form.formState.errors.state.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              placeholder="Postal code"
              {...form.register('postalCode')}
              className="w-full rounded bg-white/10 border border-white/20 p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {form.formState.errors.postalCode && (
              <p className="mt-1 text-sm text-red-400">{form.formState.errors.postalCode.message}</p>
            )}
          </div>
          <div>
            <input
              placeholder="Country (US/CA/HK)"
              {...form.register('country')}
              className="w-full rounded bg-white/10 border border-white/20 p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {form.formState.errors.country && (
              <p className="mt-1 text-sm text-red-400">{form.formState.errors.country.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!form.formState.isValid || isSubmitting || isEmpty}
          className="rounded bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-slate-950"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            'Pay with Stripe'
          )}
        </button>
      </form>

      {/* Simple summary */}
      <div className="rounded border border-white/10 p-4">
        <h2 className="mb-2 font-medium">Order summary</h2>
        <p className="text-sm text-slate-400">Prices will be validated server-side.</p>
      </div>
    </div>
  );
}
