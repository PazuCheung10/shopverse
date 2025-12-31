# ShopVerse Deployment Troubleshooting Guide

This document summarizes all deployment issues encountered and their solutions. Use this as a reference when deploying to Vercel or troubleshooting build failures.

## Table of Contents

1. [Environment Variable Issues](#environment-variable-issues)
2. [Database Migration Issues](#database-migration-issues)
3. [ESLint/TypeScript Build Errors](#eslinttypescript-build-errors)
4. [Stripe API Version Errors](#stripe-api-version-errors)
5. [Prisma Build-Time Errors](#prisma-build-time-errors)
6. [SEO Implementation](#seo-implementation)
7. [Database Seeding](#database-seeding)
8. [Quick Checklist](#quick-checklist)

---

## Environment Variable Issues

### Problem: `Environment variable not found: DATABASE_URL`

**Error:**
```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Environment variable not found: DATABASE_URL.
```

**Solution:**
1. Created conditional migration script (`scripts/migrate-if-db-exists.sh`) that skips migrations if `DATABASE_URL` is not set
2. Updated `vercel.json` to use `pnpm db:migrate:conditional` instead of `pnpm db:migrate:deploy`
3. Made env validation build-friendly with lazy loading using Proxy pattern

**Files Modified:**
- `scripts/migrate-if-db-exists.sh` - Conditional migration script
- `vercel.json` - Updated build command
- `src/lib/env.ts` - Made validation lazy with Proxy pattern

**Key Changes:**
```typescript
// src/lib/env.ts - Lazy validation with Proxy
export const env = new Proxy({} as Env, {
  get(_target, prop) {
    const validatedEnv = getEnv();
    return validatedEnv[prop as keyof Env];
  },
});
```

---

## Database Migration Issues

### Problem: `No migration found in prisma/migrations`

**Error:**
```
No migration found in prisma/migrations
No pending migrations to apply.
```

**Solution:**
1. Created initial migration manually: `prisma/migrations/20241230190000_init/migration.sql`
2. Updated `.gitignore` to allow migrations to be committed
3. Migration includes:
   - `OrderStatus` enum (PENDING, PAID, CANCELED, REFUNDED)
   - `Product` table
   - `Order` table
   - `OrderItem` table
   - All indexes and foreign keys

**Files Created:**
- `prisma/migrations/20241230190000_init/migration.sql`

**Note:** PromoCode model is not in schema - promo codes use Stripe API, not database storage.

---

## ESLint/TypeScript Build Errors

### Problem: `Definition for rule '@typescript-eslint/no-unused-vars' was not found`

**Error:**
```
Error: Definition for rule '@typescript-eslint/no-unused-vars' was not found.
```

**Solution:**
1. Installed TypeScript ESLint packages:
   ```bash
   pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
   ```
2. Updated `.eslintrc.json` to include parser and plugin:
   ```json
   {
     "parser": "@typescript-eslint/parser",
     "plugins": ["@typescript-eslint"]
   }
   ```
3. Fixed module assignment in test file (renamed `module` to `routeModule`)

**Files Modified:**
- `package.json` - Added TypeScript ESLint dependencies
- `.eslintrc.json` - Added parser and plugin configuration
- `src/app/api/stripe/webhook/route.test.ts` - Fixed module variable name

---

## Stripe API Version Errors

### Problem: `Type '"2024-11-20.acacia"' is not assignable to type '"2023-10-16"'`

**Error:**
```
Type error: Type '"2024-11-20.acacia"' is not assignable to type '"2023-10-16"'.
```

**Solution:**
Updated Stripe API version to match TypeScript types in Stripe SDK v14.25.0:

```typescript
// src/lib/stripe.ts
apiVersion: '2023-10-16', // Changed from '2024-11-20.acacia'
```

**Files Modified:**
- `src/lib/stripe.ts` - Updated API version

**Note:** Always check Stripe SDK version and use compatible API version.

---

### Problem: Stripe Promo Code Validation Error

**Error:**
```
Type error: No overload matches this call.
Object literal may only specify known properties, and 'code' does not exist in type 'CouponListParams'.
```

**Solution:**
Changed from `coupons.list()` to `promotionCodes.list()` which accepts the `code` parameter:

```typescript
// src/app/api/promo-codes/validate/route.ts
const promotionCodes = await stripe.promotionCodes.list({ 
  code: code.toUpperCase(), 
  limit: 1,
  active: true,
});
```

**Files Modified:**
- `src/app/api/promo-codes/validate/route.ts` - Use promotionCodes.list() instead of coupons.list()

---

## Prisma Build-Time Errors

### Problem: `The table 'public.Product' does not exist in the current database`

**Error:**
```
Invalid `prisma.product.findMany()` invocation:
The table `public.Product` does not exist in the current database.
```

**Solution:**
Made Prisma queries build-safe by wrapping in try-catch blocks:

1. **Product Page (`src/app/product/[slug]/page.tsx`):**
   - `generateStaticParams()` - Returns empty array if database unavailable
   - `generateMetadata()` - Returns default metadata if database unavailable

2. **Sitemap (`src/app/sitemap.ts`):**
   - Already had error handling, returns static routes only if database unavailable

**Files Modified:**
- `src/app/product/[slug]/page.tsx` - Added try-catch to build-time functions
- `src/app/sitemap.ts` - Already had error handling

**Key Pattern:**
```typescript
export async function generateStaticParams() {
  try {
    const slugs = await prisma.product.findMany({...});
    return slugs.map((s) => ({ slug: s.slug }));
  } catch (error) {
    console.warn('⚠️  Database not available during build. Product pages will be generated dynamically.');
    return [];
  }
}
```

---

## SEO Implementation

### Added Comprehensive SEO Metadata

**Files Modified:**
- `src/app/layout.tsx` - Root layout with full metadata
- `src/app/page.tsx` - Home page metadata with structured data
- `src/app/product/[slug]/page.tsx` - Dynamic product metadata
- `src/app/sitemap.ts` - Automatic sitemap generation
- `src/app/robots.ts` - Search engine crawling rules

**Features Added:**
- OpenGraph tags for social sharing
- Twitter Card metadata
- JSON-LD structured data (Product schema, Website schema)
- Dynamic metadata generation per product
- Canonical URLs
- Robots directives
- Automatic sitemap with all products

**Key Implementation:**
```typescript
// Product structured data
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  offers: {
    '@type': 'Offer',
    price: (product.unitAmount / 100).toFixed(2),
    priceCurrency: product.currency.toUpperCase(),
  },
};
```

---

## Database Seeding

### Problem: Database empty after deployment

**Solution:**
Created conditional seeding script that only runs if database is empty:

1. **Created `scripts/seed-if-empty.ts`:**
   - Checks product count
   - Only seeds if count is 0
   - Includes all 24 demo products

2. **Updated build command:**
   ```json
   {
     "buildCommand": "pnpm db:migrate:conditional && pnpm db:seed:conditional && pnpm build"
   }
   ```

**Files Created:**
- `scripts/seed-if-empty.ts` - Conditional seeding script

**Files Modified:**
- `package.json` - Added `db:seed:conditional` script
- `vercel.json` - Added seeding to build command

**Behavior:**
- First deployment: Seeds 24 products
- Subsequent deployments: Skips seeding (preserves data)

---

## Quick Checklist

### Pre-Deployment

- [ ] All environment variables set in Vercel:
  - `DATABASE_URL` (Railway PostgreSQL)
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_ENABLE_PROMO_CODES` (optional)

- [ ] Migrations exist in `prisma/migrations/`
- [ ] `.gitignore` allows migrations to be committed
- [ ] All TypeScript/ESLint errors resolved
- [ ] Stripe API version matches SDK version

### During Build

- [ ] Migrations run successfully
- [ ] Database tables created
- [ ] Seeding runs (if database empty)
- [ ] Build completes without errors
- [ ] Static pages generate correctly

### Post-Deployment

- [ ] Health check: `curl https://your-app.vercel.app/api/ping`
- [ ] Status page: `https://your-app.vercel.app/status`
- [ ] Products visible on homepage
- [ ] Product detail pages load
- [ ] Checkout flow works
- [ ] Webhook endpoint configured in Stripe

---

## Common Error Patterns

### Pattern 1: Environment Variables Not Set
**Symptom:** Build fails with "Environment variable not found"
**Fix:** Set all required env vars in Vercel dashboard

### Pattern 2: Database Not Available During Build
**Symptom:** Prisma errors about missing tables
**Fix:** Wrap Prisma calls in try-catch, return defaults during build

### Pattern 3: TypeScript Type Mismatches
**Symptom:** Type errors with external libraries (e.g., Stripe)
**Fix:** Check library version and use compatible types/versions

### Pattern 4: Missing Migrations
**Symptom:** "No migration found" or "table does not exist"
**Fix:** Create migrations, ensure they're committed to git

### Pattern 5: ESLint Rule Not Found
**Symptom:** Build fails with ESLint rule errors
**Fix:** Install required ESLint plugins/parsers

---

## Build Command Breakdown

```bash
pnpm db:migrate:conditional && pnpm db:seed:conditional && pnpm build
```

1. **`db:migrate:conditional`** - Runs migrations if DATABASE_URL is set
2. **`db:seed:conditional`** - Seeds database if empty
3. **`build`** - Builds Next.js application

---

## File Structure Reference

```
shopverse/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20241230190000_init/
│           └── migration.sql
├── scripts/
│   ├── migrate-if-db-exists.sh
│   └── seed-if-empty.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx (SEO metadata)
│   │   ├── page.tsx (Home with structured data)
│   │   ├── product/[slug]/page.tsx (Dynamic metadata)
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── lib/
│   │   ├── env.ts (Lazy validation)
│   │   └── stripe.ts (API version)
│   └── data/
│       └── seed.ts (24 products)
├── vercel.json (Build command)
└── package.json (Scripts)
```

---

## Key Learnings

1. **Always make database queries build-safe** - Wrap in try-catch for build-time execution
2. **Use conditional scripts** - Check for environment variables before running operations
3. **Lazy validation** - Use Proxy pattern for env validation to avoid build-time errors
4. **Version compatibility** - Always check library versions and use compatible API versions
5. **Idempotent operations** - Seeding should check if data exists before inserting

---

## Future Improvements

- [ ] Add database connection pooling configuration
- [ ] Implement proper error tracking (Sentry)
- [ ] Add analytics (Vercel Analytics)
- [ ] Create PromoCode model if needed for tracking usage
- [ ] Add email receipts functionality
- [ ] Implement persistent rate limiting (Redis/Edge Config)

---

**Last Updated:** December 30, 2024
**Deployment Platform:** Vercel
**Database:** Railway PostgreSQL
**Status:** ✅ Production Ready

