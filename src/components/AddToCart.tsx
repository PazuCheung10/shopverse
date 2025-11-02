'use client';

import { useState } from 'react';

export default function AddToCart({ productId }: { productId: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      disabled={busy}
      onClick={() => {
        setBusy(true);
        const raw = localStorage.getItem('shopverse:cart');
        const items: { productId: string; quantity: number }[] = raw ? JSON.parse(raw) : [];
        const idx = items.findIndex((i) => i.productId === productId);
        if (idx >= 0) items[idx].quantity += 1;
        else items.push({ productId, quantity: 1 });
        localStorage.setItem('shopverse:cart', JSON.stringify(items));
        setBusy(false);
        // Dispatch event to update navbar cart count
        window.dispatchEvent(new Event('cartUpdated'));
        // Optional: toast here
      }}
      className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Add to cart
    </button>
  );
}
