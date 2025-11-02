import { prisma } from './prisma';

export async function getProducts() {
  return await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProductBySlug(slug: string) {
  return await prisma.product.findUnique({
    where: { slug, active: true },
  });
}

export async function getProductById(id: string) {
  return await prisma.product.findUnique({
    where: { id, active: true },
  });
}

