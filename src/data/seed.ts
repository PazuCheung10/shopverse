import { prisma } from '../lib/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in correct order to respect foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  // Create 8 demo products
  const products = await prisma.product.createMany({
    data: [
      {
        slug: 'aurora-headphones',
        name: 'Aurora Headphones',
        description: 'Wireless over-ear with spatial audio.',
        imageUrl: 'https://images.unsplash.com/photo-1518441902110-9d3f2e1b1b48?q=80&w=1200&auto=format&fit=crop',
        currency: 'usd',
        unitAmount: 15900, // $159.00
        active: true,
      },
      {
        slug: 'nebula-backpack',
        name: 'Nebula Backpack',
        description: 'Everyday carry with laptop sleeve.',
        imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
        currency: 'usd',
        unitAmount: 9800, // $98.00
        active: true,
      },
      {
        slug: 'stellar-watch',
        name: 'Stellar Watch',
        description: 'Premium smartwatch with health monitoring.',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop',
        currency: 'usd',
        unitAmount: 34900, // $349.00
        active: true,
      },
      {
        slug: 'cosmic-keyboard',
        name: 'Cosmic Keyboard',
        description: 'Mechanical RGB keyboard with premium switches.',
        imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?q=80&w=1200&auto=format&fit=crop',
        currency: 'usd',
        unitAmount: 12900, // $129.00
        active: true,
      },
      {
        slug: 'galaxy-mouse',
        name: 'Galaxy Mouse',
        description: 'Wireless ergonomic mouse with precision tracking.',
        imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=1200&auto=format&fit=crop',
        currency: 'usd',
        unitAmount: 4900, // $49.00
        active: true,
      },
      {
        slug: 'lunar-laptop-stand',
        name: 'Lunar Laptop Stand',
        description: 'Adjustable aluminum stand for optimal ergonomics.',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=1200&auto=format&fit=crop',
        currency: 'usd',
        unitAmount: 7900, // $79.00
        active: true,
      },
      {
        slug: 'solar-monitor',
        name: 'Solar Monitor',
        description: '27-inch 4K display with HDR support.',
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop',
        currency: 'usd',
        unitAmount: 44900, // $449.00
        active: true,
      },
      {
        slug: 'orbit-desk-pad',
        name: 'Orbit Desk Pad',
        description: 'Extended desk mat with premium finish.',
        imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?q=80&w=1200&auto=format&fit=crop',
        currency: 'usd',
        unitAmount: 3500, // $35.00
        active: true,
      },
    ],
  });

  console.log(`✅ Created ${products.count} products`);
  console.log('📦 Products seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

