# ShopVerse

Minimal, modern e-commerce demo from product list → cart → Stripe Checkout → order receipt (via webhooks).

## Setup

1. Install dependencies:
```bash
npm install
# or
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
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Run the development server (always on port 3000):
```bash
pnpm dev -p 3000
# or
npm run dev
```
Expect: `ready - started server on http://localhost:3000`

6. For local webhook testing with Stripe CLI:
   
   **Terminal A** - Start dev server:
   ```bash
   pnpm dev -p 3000
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

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample products
- `npm run db:studio` - Open Prisma Studio
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
