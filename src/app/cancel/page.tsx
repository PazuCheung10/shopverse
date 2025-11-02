import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="text-center space-y-6">
      <div className="inline-block p-4 bg-red-500/20 rounded-full">
        <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-red-400">Checkout canceled</h1>
      <p className="text-slate-400">Your cart has been preserved. You can continue shopping or return to your cart.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Link href="/cart" className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400">
          Return to Cart
        </Link>
        <Link href="/" className="rounded-md bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
