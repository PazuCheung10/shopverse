#!/bin/sh
# Conditionally seed database only if it's empty
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL found, checking if database needs seeding..."
  
  # Check if any products exist
  PRODUCT_COUNT=$(pnpm tsx -e "
    import { prisma } from './src/lib/prisma.ts';
    prisma.product.count().then(count => {
      console.log(count);
      prisma.\$disconnect();
    }).catch(() => {
      console.log('0');
      prisma.\$disconnect();
    });
  " 2>/dev/null || echo "0")
  
  if [ "$PRODUCT_COUNT" = "0" ] || [ -z "$PRODUCT_COUNT" ]; then
    echo "Database is empty, running seed..."
    pnpm db:seed
  else
    echo "Database already has $PRODUCT_COUNT products, skipping seed."
  fi
else
  echo "DATABASE_URL not set, skipping seed..."
fi

