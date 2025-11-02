import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function CancelPage() {
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="inline-block p-4 bg-red-500/20 rounded-full mb-4">
            <svg
              className="w-16 h-16 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-red-400 mb-4">Payment Cancelled</h1>
          <p className="text-slate-300 text-lg mb-2">Your payment was cancelled</p>
          <p className="text-slate-400 mb-8">Don't worry, your cart has been preserved.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={routes.cart}
              className="inline-block px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 transition-colors"
            >
              Return to Cart
            </Link>
            <Link
              href={routes.home}
              className="inline-block px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
