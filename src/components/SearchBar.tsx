'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query.trim());
    }
    // Reset to page 1 when searching
    router.push(`/?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery('');
    router.push('/');
  };

  const hasSearch = searchParams.get('q');

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="flex-1 rounded-md bg-white/10 border border-white/20 px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label="Search products"
        />
        <button
          type="submit"
          className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400 transition-colors"
        >
          Search
        </button>
        {hasSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md bg-white/10 px-4 py-2 font-medium text-slate-100 hover:bg-white/20 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {hasSearch && (
        <p className="mt-2 text-sm text-slate-400">
          Searching for: &quot;{hasSearch}&quot;
        </p>
      )}
    </form>
  );
}

