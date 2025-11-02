'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="text-center space-y-6">
      <div className="inline-block p-4 bg-green-500/20 rounded-full">
        <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-green-400">Payment received</h1>
      {sessionId && <p className="text-sm text-slate-400 font-mono">Session: {sessionId.slice(0, 8)}...</p>}
      <div className="pt-4">
        <Link href="/" className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400">
          Back to catalog
        </Link>
      </div>
    </div>
  );
}
