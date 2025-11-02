import { prisma } from '@/lib/prisma';
import ProductDetailSkeleton from '@/components/ProductDetailSkeleton';
import { ProductContent } from './ProductContent';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export async function generateStaticParams() {
  const slugs = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true },
  });

  return slugs.map((s) => ({ slug: s.slug }));
}

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function ProductData({ slug }: { slug: string }) {
  const p = await prisma.product.findUnique({ where: { slug } });

  if (!p || !p.active) return notFound();

  return <ProductContent p={p} />;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductData slug={slug} />
    </Suspense>
  );
}
