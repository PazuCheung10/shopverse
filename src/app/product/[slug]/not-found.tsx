import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function ProductNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-cyan-300 mb-4">Product Not Found</h1>
        <p className="text-slate-400 mb-8">The product you're looking for doesn't exist.</p>
        <Link
          href={routes.home}
          className="inline-block px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 transition-colors duration-200"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

