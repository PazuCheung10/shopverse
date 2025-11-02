import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  let dbStatus = 'unknown';
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
    dbError = error instanceof Error ? error.message : 'Unknown error';
  }

  const hasStripeKey = !!env.STRIPE_SECRET_KEY;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const promoEnabled = env.NEXT_PUBLIC_ENABLE_PROMO_CODES;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">System Status</h1>

        <div className="rounded border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-medium mb-3">Database</h2>
            <div className="flex items-center gap-2">
              {dbStatus === 'connected' ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  <span className="text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 rounded-full bg-red-400"></span>
                  <span className="text-red-400">Disconnected</span>
                </>
              )}
            </div>
            {dbError && (
              <p className="text-xs text-red-400 mt-1 font-mono">{dbError}</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium mb-3">Stripe Configuration</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {hasStripeKey ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span>Secret Key: Present</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span>Secret Key: Missing</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasWebhookSecret ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span>Webhook Secret: Present</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span>Webhook Secret: Missing (set via Stripe CLI)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-3">Application</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">App URL:</span>{' '}
                <span className="font-mono">{appUrl}</span>
              </div>
              <div>
                <span className="text-slate-400">Promo Codes:</span>{' '}
                {promoEnabled ? (
                  <span className="text-green-400">Enabled</span>
                ) : (
                  <span className="text-slate-500">Disabled</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          <p>Build: {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'}</p>
        </div>
      </div>
    </div>
  );
}

