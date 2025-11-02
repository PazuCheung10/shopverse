import { prisma } from '../src/lib/prisma';

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, status: true, total: true, currency: true, email: true, createdAt: true },
  });

  if (orders.length === 0) {
    console.log('📦 No orders found in database.\n');
    console.log('💡 Tip: Trigger a test webhook with:');
    console.log('   stripe trigger checkout.session.completed\n');
    return;
  }

  console.log(`\n📦 Found ${orders.length} most recent orders:\n`);
  orders.forEach((order, index) => {
    const totalFormatted = `$${(order.total / 100).toFixed(2)} ${order.currency.toUpperCase()}`;
    console.log(`${index + 1}. Order: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: ${totalFormatted}`);
    console.log(`   Email: ${order.email || 'N/A'}`);
    console.log(`   Created: ${order.createdAt.toISOString()}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
