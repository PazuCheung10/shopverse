# ShopVerse

Minimal, modern e-commerce demo from product list → cart → Stripe Checkout → order receipt (via webhooks).

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up your database (PostgreSQL):
   - Create a database on Neon, Supabase, or PlanetScale
   - Copy `.env.example` to `.env.local`
   - Add your `DATABASE_URL` to `.env.local`

3. Set up Stripe:
   - Get your Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com)
   - Add to `.env.local`:
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

4. Initialize database:
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

5. Run the development server (always on port 3000):
```bash
pnpm dev
```
Expect: `ready - started server on http://localhost:3000`

6. For local webhook testing with Stripe CLI:
   
   **Terminal A** - Start dev server:
   ```bash
   pnpm dev
   ```
   
   **Terminal B** - Start Stripe webhook listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   - Copy the webhook signing secret (starts with `whsec_`) that appears
   - Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`
   - **Restart Terminal A** (the dev server) so it picks up the new env var
   
   **Terminal C** - Test the webhook:
   ```bash
   # Health check (should return {"ok":true,"route":"stripe/webhook"})
   curl http://localhost:3000/api/stripe/webhook
   
   # Trigger a test event
   stripe trigger checkout.session.completed
   ```
   
   - In Terminal A, you should see: `✅ Webhook received: checkout.session.completed` and `🧾 Order upserted: <id> PAID`
   - In Terminal B, you should see: `← [200] OK`

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 14/15 (App Router)
- PostgreSQL + Prisma
- Stripe Checkout + Webhooks
- React Hook Form + Zod
- Tailwind CSS
- TypeScript

## Project Structure

See `architecture.md` for detailed architecture documentation.

## Test Cards

Use these test cards in Stripe Checkout:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Deployment (Vercel)

### Prerequisites

1. **Database**: Set up a production PostgreSQL database (Neon, Supabase, or PlanetScale)
2. **Stripe Account**: Get your production Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com)

### Environment Variables

Add these environment variables in your Vercel project settings:

**Required:**
- `DATABASE_URL` - Your production PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_live_` for production)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_live_` for production)
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-app.vercel.app`)
- `STRIPE_WEBHOOK_SECRET` - Production webhook signing secret (see below)

### Setting up Production Stripe Webhook

1. Deploy your app to Vercel first (get the production URL)

2. Create a webhook endpoint in Stripe Dashboard:
   ```bash
   # Using Stripe CLI (recommended for testing)
   stripe listen --forward-to https://your-app.vercel.app/api/stripe/webhook
   ```

   Or in Stripe Dashboard:
   - Go to [Webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"
   - Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events to send: Select `checkout.session.completed`
   - Copy the "Signing secret" (starts with `whsec_`)

3. Add the webhook signing secret to Vercel:
   - Variable name: `STRIPE_WEBHOOK_SECRET`
   - Value: The `whsec_...` value from step 2
   - Environment: Production (and Preview if desired)

### Deploy

1. Connect your GitHub repository to Vercel

2. Vercel will automatically:
   - Run `pnpm install`
   - Run `pnpm db:generate` (via postinstall)
   - Run `pnpm db:migrate:deploy` (via buildCommand)
   - Run `pnpm build`

3. Your app should be live at `https://your-app.vercel.app`

### Verifying Deployment

1. **Browse catalog**: Visit your production URL and verify products load
2. **Test checkout**:
   - Add items to cart
   - Complete checkout with test card: `4242 4242 4242 4242`
   - Verify redirect to success page
3. **Verify order in DB**:
   ```bash
   # Set DATABASE_URL to production DB
   pnpm check:orders
   ```
   - Should show order with status `PAID`

### Troubleshooting

- **Migrations fail**: Ensure `DATABASE_URL` is correct and database exists
- **Webhook not working**: 
  - Verify `STRIPE_WEBHOOK_SECRET` is set correctly
  - Check Stripe Dashboard → Webhooks → Recent events for delivery status
  - Ensure production URL is accessible (not blocked by firewall)

## Scripts

- `pnpm dev` - Start development server (port 3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations (development)
- `pnpm db:migrate:deploy` - Run database migrations (production)
- `pnpm db:seed` - Seed database with sample products
- `pnpm db:studio` - Open Prisma Studio
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Type check without emitting
- `pnpm format` - Format code with Prettier
- `pnpm check:orders` - Check recent orders in database
