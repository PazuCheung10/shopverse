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
   - **Optional**: Enable promo codes by setting `NEXT_PUBLIC_ENABLE_PROMO_CODES=true`

4. Initialize database:
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

5. Run the development server (port 3001):
```bash
pnpm dev
```
Expect: `ready - started server on http://localhost:3001`

6. For local webhook testing with Stripe CLI:
   
   **Terminal A** - Start dev server:
   ```bash
   pnpm dev
   ```
   
   **Terminal B** - Start Stripe webhook listener:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
   - Copy the webhook signing secret (starts with `whsec_`) that appears
   - Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`
   - **Restart Terminal A** (the dev server) so it picks up the new env var
   
   **Terminal C** - Test the webhook:
   ```bash
   # Health check (should return {"ok":true,"route":"stripe/webhook"})
   curl http://localhost:3001/api/stripe/webhook
   
   # Trigger a test event
   stripe trigger checkout.session.completed
   ```
   
   - In Terminal A, you should see: `✅ Webhook received: checkout.session.completed` and `🧾 Order upserted: <id> PAID`
   - In Terminal B, you should see: `← [200] OK`

## Getting the UI Running (Catalog → Cart → Checkout)

1. **Seed demo products (with images)**:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

2. **Start dev server (port 3001)**:
   ```bash
   pnpm dev
   ```

3. **Browse the app**:
   - `/` – Product catalog grid (12 demo products, ISR cached)
   - `/product/[slug]` – Product detail page with Add to Cart button
   - `/cart` – Shopping cart with quantity controls and server-priced subtotal
   - `/checkout` – Address form (RHF + Zod validation) → Stripe Checkout redirect
   - `/success` – Full order receipt with masked email/address (uses DB OrderItems, faster than Stripe API)
   - `/cancel` – Payment canceled (cart preserved)

**Auth/Admin**: Not included by design (portfolio scope). Products are seeded. Enable an admin panel later if needed (see "Enhancements").

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Tech Stack

- Next.js 14/15 (App Router)
- PostgreSQL + Prisma
- Stripe Checkout + Webhooks
- React Hook Form + Zod
- Tailwind CSS
- TypeScript

## Features

- **Guest Checkout**: No authentication required – customers can browse and purchase without accounts
- **Product Catalog**: Browse products with images, descriptions, and pricing (ISR for performance)
- **Product Search & Pagination**: API supports search (`?q=term`) and pagination (`?page=1&limit=12`)
- **Shopping Cart**: Client-side cart with localStorage persistence and server-validated pricing
- **Toast Notifications**: Accessible toast system with auto-dismiss and hover pause
- **Stripe Checkout**: Secure payment processing with Stripe Checkout Sessions
- **Order Management**: Webhook-based order persistence with OrderItems stored in DB (faster receipts, complete order history)
- **Promo Codes** (optional): Enable with `NEXT_PUBLIC_ENABLE_PROMO_CODES=true` to allow discount coupons
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS dark theme

## API Endpoints

- `GET /api/products` – Products API
  - `?ids=id1,id2` – Fetch specific products (for cart)
  - `?page=1&limit=12` – Pagination (default page=1, limit=12, max limit=50)
  - `?q=searchterm` – Case-insensitive search in name/description
  - Returns: `{ products, page, limit, total, hasMore }`

- `POST /api/checkout` – Create Stripe Checkout Session
  - Body: `{ items: [{ productId, quantity }], address: {...}, promoCode?: string }`
  - Returns: `{ id, url }` (redirect to `url`)

- `POST /api/stripe/webhook` – Stripe webhook handler
  - Verifies signature and persists orders + OrderItems on `checkout.session.completed`
  - Maps Stripe line items to DB products via `app_product_id` metadata
  - Returns: `{ received: true }` on success

- `GET /api/orders/[id]` – Fetch order details
- `GET /api/promo-codes/validate?code=XXX` – Validate promo code (if enabled)

## Project Structure

See `architecture.md` for detailed architecture documentation.

Key directories:
- `src/app/` – Next.js App Router pages and API routes
- `src/components/` – React components
- `src/lib/` – Utilities (prisma, stripe, validation, etc.)
- `src/data/` – Seed scripts
- `prisma/` – Database schema and migrations

## Test Cards

Use these test cards in Stripe Checkout:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Promo Codes (Optional Feature)

Promo codes allow customers to apply discounts at checkout using Stripe coupons.

### Enabling Promo Codes

1. Add to `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_PROMO_CODES=true
   ```

2. Restart your dev server

3. The promo code input will appear on the checkout page

### Creating Test Coupons in Stripe

1. Go to [Stripe Dashboard → Coupons](https://dashboard.stripe.com/coupons)
2. Click "Create coupon"
3. Configure your coupon:
   - **ID/Code**: Enter a code (e.g., `SAVE10`, `WELCOME20`)
   - **Type**: Percentage off or Amount off
   - **Value**: Discount amount (e.g., 10% or $5.00)
   - **Duration**: Once, forever, or repeating
   - **Redemption limits**: Optional (max redemptions, expiration)
4. Save the coupon

### Testing Promo Codes

1. Enable the feature flag (`NEXT_PUBLIC_ENABLE_PROMO_CODES=true`)
2. Add items to cart and go to checkout
3. Enter a valid coupon code (must match exactly, case-insensitive)
4. The code will be validated in real-time
5. If valid, the discount will be applied in Stripe Checkout
6. Complete the test payment to see the discounted amount

### Promo Code Requirements

- Codes must be 3-20 characters
- Alphanumeric only (automatically converted to uppercase)
- Must exist as a valid, non-expired coupon in your Stripe account
- Applied at checkout session creation (discount visible in Stripe Checkout UI)

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

**Optional (Feature Flags):**
- `NEXT_PUBLIC_ENABLE_PROMO_CODES` - Set to `"true"` to enable promo code feature (default: disabled). When enabled, customers can enter promo codes at checkout to apply Stripe coupon discounts.

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
   - Run `pnpm install` (triggers `postinstall` → `prisma generate`)
   - Run `pnpm db:migrate:deploy` (via buildCommand in vercel.json)
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

## Testing

Run tests with Vitest:
```bash
pnpm test
```

### Test Coverage

**Unit Tests:**
- `lib/currency.test.ts` - Price formatting utilities
- `lib/cart.test.ts` - Cart localStorage helpers
- `lib/validation.test.ts` - Zod schema validation

**Component Tests:**
- `components/ProductCard.test.tsx` - Product card rendering
- `components/AddressForm.test.tsx` - Form validation and submission
- `components/PromoCodeInput.test.tsx` - Promo code input (optional feature)

**API Route Tests:**
- `app/api/checkout/route.test.ts` - Checkout session creation with mocked Stripe
- `app/api/stripe/webhook/route.test.ts` - Webhook signature verification
- `app/api/promo-codes/validate/route.test.ts` - Promo code validation

**Important Test Scenarios:**
- ✅ Invalid form data rejection
- ✅ Stripe webhook signature verification
- ✅ Server-side price validation
- ✅ Promo code validation (when enabled)
- ✅ Cart operations (add, update, remove)

## Scripts

- `pnpm dev` - Start development server (port 3001)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations (development)
- `pnpm db:migrate:deploy` - Run database migrations (production)
- `pnpm db:seed` - Seed database with sample products
- `pnpm db:studio` - Open Prisma Studio
- `pnpm test` - Run tests (Vitest)
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Type check without emitting
- `pnpm format` - Format code with Prettier
- `pnpm check:orders` - Check recent orders in database
