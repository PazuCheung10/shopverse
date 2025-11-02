import { prisma } from '../lib/prisma';

async function main() {
  console.log('Seeding database...');

  // Clear existing products
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  // Create sample products
  const products = await prisma.product.createMany({
    data: [
      {
        slug: 'sample-product-1',
        name: 'Sample Product 1',
        description: 'A sample product for testing',
        imageUrl: 'https://via.placeholder.com/400x400',
        currency: 'usd',
        unitAmount: 2999, // $29.99
        active: true,
      },
      {
        slug: 'sample-product-2',
        name: 'Sample Product 2',
        description: 'Another sample product',
        imageUrl: 'https://via.placeholder.com/400x400',
        currency: 'usd',
        unitAmount: 4999, // $49.99
        active: true,
      },
      {
        slug: 'sample-product-3',
        name: 'Sample Product 3',
        description: 'Yet another sample product',
        imageUrl: 'https://via.placeholder.com/400x400',
        currency: 'usd',
        unitAmount: 1999, // $19.99
        active: true,
      },
    ],
  });

  console.log(`Created ${products.count} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

