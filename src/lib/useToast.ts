'use client';

import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const ToastContainer = () => {
    if (toasts.length === 0) return null;

    return (
      <>
        {/* Live region for screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {toasts.map((toast) => (
            <span key={toast.id}>
              {toast.type === 'error' && 'Error: '}
              {toast.type === 'success' && 'Success: '}
              {toast.message}
            </span>
          ))}
        </div>
        {/* Visual toasts */}
        <div
          className="fixed top-4 right-4 z-50 flex flex-col gap-2"
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="alert"
              className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm ${
                toast.type === 'success'
                  ? 'bg-green-500/90 text-white'
                  : toast.type === 'error'
                    ? 'bg-red-500/90 text-white'
                    : 'bg-cyan-500/90 text-white'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950`}
              tabIndex={-1}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </>
    );
  };

  return { showToast, ToastContainer };
}

