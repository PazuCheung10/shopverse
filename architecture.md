🛍️ ShopVerse — Architecture Overview

Minimal, modern e-commerce demo from product list → cart → Stripe Checkout → order receipt (via webhooks).
Goal: demonstrate clean domain modeling, safe validation (Zod), solid forms (RHF), and bullet-proof payment flow.

!!! add this file to .gitignore (keep a public redacted ARCHITECTURE.public.md)

Commit style
Use feat:, fix:, refactor:, chore:, docs:.
Commit per feature (small, reviewable diffs).

⸻

1) Purpose

ShopVerse showcases a production-grade checkout path with server validation and webhook-driven order finalization. It’s the commerce pillar in the portfolio:
	•	InsightBoard – async data flow & charts
	•	TaskZen – offline-first state & UI logic
	•	WeatherFlow – API + map + UX polish
	•	ShopVerse – full-stack checkout + validation + webhooks

Focus: catalog → cart → address form → Stripe Checkout → webhook → receipt.
No CMS required; seed data via Prisma. Guest checkout by default.

⸻

2) Tech Stack

Layer	Tech	Purpose
App	Next.js 14/15 App Router + TypeScript	SSR/ISR, Route Handlers (/app/api)
DB/ORM	PostgreSQL (Neon/Supabase/PlanetScale*), Prisma	Schema, migrations, seeding
Payments	Stripe Checkout + Webhooks	PCI offload, receipts, refunds-ready
Forms	React Hook Form + Zod Resolver	Client + server validation parity
UI	Tailwind CSS	Utility-first, accessible UI
State	Minimal local state + URL state	Cart & form flow without heavy libs
Validation	Zod	Runtime-safe payloads (server first)
Auth	(Optional) NextAuth	Only if you enable admin CRUD
Testing	Vitest + Testing Library	Units, components, API handlers
DevOps	Vercel	Preview deploys, env management
Lint/Format	ESLint + Prettier	Consistent codebase

* PlanetScale if MySQL; otherwise prefer Postgres (Neon/Supabase). Pick one.

⸻

3) Directory Structure

/src
├─ app
│  ├─ layout.tsx
│  ├─ page.tsx                     # / → Product grid (ISR)
│  ├─ product/[slug]/page.tsx      # Product detail (SSR/ISR)
│  ├─ cart/page.tsx                # Client cart view
│  ├─ checkout/page.tsx            # Address + summary form (RHF + Zod)
│  ├─ success/page.tsx             # Post-payment success w/ order lookup
│  ├─ cancel/page.tsx              # Cancelled payment (cart preserved)
│  └─ api
│     ├─ checkout/route.ts         # POST → create Stripe Checkout Session
│     ├─ stripe/webhook/route.ts   # POST → handle Stripe webhooks (orders)
│     ├─ products/route.ts         # GET → paginated catalog (if needed)
│     └─ orders/[id]/route.ts      # GET → order detail (receipt)
├─ components
│  ├─ ProductCard.tsx
│  ├─ ProductGallery.tsx
│  ├─ Price.tsx
│  ├─ AddToCart.tsx
│  ├─ CartSheet.tsx                # Slide-over cart (optional)
│  ├─ AddressForm.tsx              # RHF + Zod
│  ├─ EmptyState.tsx / ErrorState.tsx / Loading.tsx
│  └─ Toast.tsx
├─ lib
│  ├─ prisma.ts                    # Prisma client (singleton)
│  ├─ stripe.ts                    # Stripe SDK init (secret key)
│  ├─ env.ts                       # zod-validated env loader
│  ├─ currency.ts                  # format helpers
│  ├─ cart.ts                      # cart utils (id, qty, totals)
│  ├─ routes.ts                    # path helpers
│  ├─ validation.ts                # shared Zod schemas
│  └─ webhook.ts                   # signature verification helpers
├─ data
│  └─ seed.ts                      # seed products, prices, images
├─ styles
│  └─ globals.css
├─ tests
│  ├─ unit/*.test.ts
│  ├─ components/*.test.tsx
│  └─ api/*.test.ts
└─ prisma
   ├─ schema.prisma
   └─ migrations/*

Configs: next.config.js, tailwind.config.js, postcss.config.js, tsconfig.json, .eslintrc, .prettierrc.

⸻

4) Environment & Secrets

# .env.example
# Stripe
STRIPE_SECRET_KEY=sk_test_**************
STRIPE_WEBHOOK_SECRET=whsec_***********
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_***********

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

Security notes
	•	Never commit real secrets.
	•	Webhook endpoint must verify signature using STRIPE_WEBHOOK_SECRET.
	•	Use Vercel envs; restrict Stripe keys to dev/prod.
	•	Consider idempotency keys for checkout session creation.

⸻

5) Data Model

Prisma schema (simplified)

// prisma/schema.prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model Product {
  id         String   @id @default(cuid())
  slug       String   @unique
  name       String
  description String
  imageUrl   String
  currency   String   @default("usd")
  unitAmount Int      // price in smallest units
  active     Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  OrderItem  OrderItem[]
}

model Order {
  id              String   @id @default(cuid())
  email           String
  name            String?
  addressLine1    String?
  addressLine2    String?
  city            String?
  state           String?
  postalCode      String?
  country         String?
  currency        String
  subtotal        Int
  total           Int
  stripePaymentId String   @unique
  status          OrderStatus @default(PENDING)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  items           OrderItem[]
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String
  productId  String
  quantity   Int
  unitAmount Int
  product    Product @relation(fields: [productId], references: [id])
  order      Order   @relation(fields: [orderId], references: [id])
}

enum OrderStatus {
  PENDING
  PAID
  CANCELED
  REFUNDED
}

Shared runtime types

// src/lib/validation.ts
import { z } from "zod";

export const CartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10),
});

export const AddressSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(2).max(20),
  country: z.string().length(2), // ISO-3166-1 alpha-2
});

export const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  address: AddressSchema,
});
export type CheckoutPayload = z.infer<typeof CheckoutSchema>;


⸻

6) Routes & Flow

GET   /                      → Product grid (ISR)
GET   /product/[slug]        → Detail page (SSR/ISR)
GET   /cart                  → Client cart UI
GET   /checkout              → Address + summary (RHF+Zod)

POST  /api/checkout          → Creates Stripe Checkout Session
POST  /api/stripe/webhook    → Verifies signature → upserts Order
GET   /api/orders/[id]       → Order detail (for /success page)

GET   /success?session_id=   → Reads session → redirect to /success/[orderId]
GET   /cancel                → Informational (keep cart)

User journey
	1.	Browse catalog → add items to cart
	2.	/checkout: enter email + address (RHF + Zod)
	3.	POST /api/checkout → validates payload → creates Stripe Checkout Session
	4.	Redirect to Stripe → pay (test mode)
	5.	Stripe calls /api/stripe/webhook → verify signature → mark Order PAID
	6.	User lands on /success → fetch order by session → show receipt

⸻

7) API Layer (sketches)

Create checkout session

// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { CheckoutSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = CheckoutSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Fetch products from DB to trust price & name
  const ids = parsed.data.items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: ids }, active: true } });

  // Build Stripe line items from trusted DB values
  const line_items = parsed.data.items.map(i => {
    const p = products.find(p => p.id === i.productId)!;
    return {
      price_data: {
        currency: p.currency,
        unit_amount: p.unitAmount,
        product_data: { name: p.name, images: [p.imageUrl] },
      },
      quantity: i.quantity,
      adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
    customer_email: parsed.data.address.email,
    metadata: { cart: JSON.stringify(parsed.data.items) }, // optional
    shipping_address_collection: { allowed_countries: ["US", "CA", "HK"] },
  }, { idempotencyKey: crypto.randomUUID() });

  return NextResponse.json({ id: session.id, url: session.url });
}

Webhook handler (paid orders)

// src/app/api/stripe/webhook/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature")!;
  const buf = Buffer.from(await req.arrayBuffer());
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as any;
    // Upsert order (idempotent on stripePaymentId)
    await prisma.order.upsert({
      where: { stripePaymentId: s.id },
      create: {
        stripePaymentId: s.id,
        email: s.customer_details?.email ?? "",
        name: s.customer_details?.name ?? "",
        currency: s.currency,
        subtotal: s.amount_subtotal ?? 0,
        total: s.amount_total ?? 0,
        status: "PAID",
        // Shipping if available
        addressLine1: s.customer_details?.address?.line1 ?? undefined,
        addressLine2: s.customer_details?.address?.line2 ?? undefined,
        city:        s.customer_details?.address?.city ?? undefined,
        state:       s.customer_details?.address?.state ?? undefined,
        postalCode:  s.customer_details?.address?.postal_code ?? undefined,
        country:     s.customer_details?.address?.country ?? undefined,
        // Items persisted separately if needed (via Line Items API)
      },
      update: { status: "PAID" },
    });
  }

  return NextResponse.json({ received: true });
}


⸻

8) State & Data Flow
	•	Server-trust first: Prices & product names come from DB only (never from client).
	•	Cart: client state (localStorage) → validated against DB at /api/checkout.
	•	Form: RHF controlled inputs; Zod on client for UX, server re-validates.
	•	After payment: webhook marks order; success page fetches order via session_id.

LocalStorage keys:
	•	shopverse:cart → { productId, quantity }[] (max 20)
	•	shopverse:email → last used email (optional)

⸻

9) UI/UX Flow
	•	Home: grid of active products, hover motion, add-to-cart.
	•	Cart sheet: update qty/remove, subtotal, proceed to checkout.
	•	Checkout: address/email form with inline errors; order summary.
	•	Success: receipt with masked address + items + total.
	•	States: loading skeletons, empty/error components.
	•	A11y: proper labels, focus management on route changes, AA contrast.
	•	Motion: subtle Framer Motion entrances; respect prefers-reduced-motion.

Design tokens (Tailwind)
	•	Background: bg-slate-950
	•	Card: bg-white/10 backdrop-blur
	•	Accent: ring-cyan-400 / text-cyan-300
	•	Spacing rhythm: space-y-6, gap-6

⸻

10) Performance
	•	ISR for catalog & product pages; cache product queries.
	•	Lazy-load cart sheet & success receipt.
	•	Avoid re-render storms: split components, memo Price, AddToCart.
	•	Use next/image for product images (static domains configured).
	•	Route Handlers at Edge where possible (not for webhook—needs raw body).

⸻

11) Security & Compliance
	•	Verify Stripe webhook signatures (raw body).
	•	Server-side price authority (no client prices).
	•	Use idempotency keys when creating sessions.
	•	Input validation on server (Zod) before touching Stripe/DB.
	•	Hide secrets; scope Stripe keys to environment.
	•	GDPR-ish hygiene: store only what you display; no card data ever touches app.

⸻

12) Testing
	•	Unit: currency.ts, cart.ts, Zod validators.
	•	Component: AddToCart, AddressForm (RHF error states).
	•	API: checkout route (valid/invalid payload), webhook (signature ok/bad).
	•	E2E (optional): Playwright happy path (mock Stripe).

⸻

13) Setup & Scripts

# Install
pnpm i

# DB
pnpm prisma generate
pnpm prisma migrate dev
pnpm tsx src/data/seed.ts

# Dev
pnpm dev

# Test
pnpm test

Stripe CLI (dev webhook tunnel)

stripe listen --forward-to localhost:3000/api/stripe/webhook

Test cards
	•	4242 4242 4242 4242 • any future exp • any CVC • any ZIP

⸻

14) Deployment
	•	Vercel:
	•	Set env vars (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, DATABASE_URL, NEXT_PUBLIC_APP_URL).
	•	Configure Image domains.
	•	Create separate webhook endpoint in Stripe Dashboard for production URL.
	•	Use Vercel previews on PRs; run migrations on deploy (or prisma migrate deploy via build step/cron).

⸻

15) Future Enhancements
	•	Promo codes / coupons (Stripe).
	•	Inventory & stock decrement (row-level locking).
	•	Saved carts for logged-in users (NextAuth).
	•	Admin mini-panel for product CRUD (role-gated).
	•	Order email via Stripe receipts or Resend.
	•	Multi-currency with price tables per region.
	•	Apple Pay / Google Pay (auto-enabled in Checkout).
	•	Refund webhooks to flip REFUNDED.

⸻

16) Troubleshooting

Webhook 400: invalid signature
	•	Ensure raw body access; do not await req.json() before verify.
	•	Use Stripe CLI to forward; update STRIPE_WEBHOOK_SECRET.

Prices don’t match
	•	Ensure server reads from DB; never accept client unitAmount.
	•	Reseed after schema changes.

Prisma client duplication (hot reload)
	•	Use singleton pattern in lib/prisma.ts.

Next Image errors
	•	Add image host to next.config.js images.domains.

⸻

17) Summary

ShopVerse demonstrates a realistic cart → checkout → webhook order loop with server-owned pricing, Zod-validated inputs, and Stripe-verified payments. It’s deliberately lean yet production-shaped, showing you can ship commerce flows that are safe, fast, and elegant.