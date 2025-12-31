import type { Metadata } from 'next';
import { ReactNode } from 'react';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/lib/useToast';
import Toast from '@/components/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import SafariDetector from '@/components/SafariDetector';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: {
    default: 'ShopVerse - Modern E-commerce Platform',
    template: '%s | ShopVerse',
  },
  description: 'ShopVerse - A modern e-commerce platform with secure Stripe checkout, featuring a seamless shopping experience with real-time inventory and secure payment processing.',
  keywords: [
    'ecommerce',
    'online store',
    'shopping',
    'stripe',
    'e-commerce platform',
    'online shopping',
    'secure checkout',
    'modern shopping',
  ],
  authors: [{ name: 'ShopVerse' }],
  creator: 'ShopVerse',
  publisher: 'ShopVerse',
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: env.NEXT_PUBLIC_APP_URL,
    siteName: 'ShopVerse',
    title: 'ShopVerse - Modern E-commerce Platform',
    description: 'A modern e-commerce platform with secure Stripe checkout, featuring a seamless shopping experience with real-time inventory and secure payment processing.',
    images: [
      {
        url: `${env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'ShopVerse - Modern E-commerce Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopVerse - Modern E-commerce Platform',
    description: 'A modern e-commerce platform with secure Stripe checkout, featuring a seamless shopping experience.',
    images: [`${env.NEXT_PUBLIC_APP_URL}/og-image.png`],
    creator: '@shopverse',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Detect Safari immediately (before React hydration) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var ua = navigator.userAgent;
                  var isAppleWebKit = /AppleWebKit/.test(ua);
                  var isChromeOrCriOS = /Chrome|CriOS/.test(ua);
                  var isSafari = isAppleWebKit && !isChromeOrCriOS;
                  if (isSafari) {
                    document.documentElement.classList.add('safari');
                    document.body.classList.add('safari-pad');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-slate-950 text-slate-100 antialiased">
        <SafariDetector />
        <ErrorBoundary>
          <ToastProvider>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            <Toast />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

