import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import Price from '@/components/Price';
import AddToCart from '@/components/AddToCart';
import { notFound } from 'next/navigation';

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

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug } });

  if (!p || !p.active) return notFound();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
        <Image
          src={p.imageUrl}
          alt={p.name}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 50vw"
        />
      </div>
      <div>
        <h1 className="mb-2 text-2xl font-semibold">{p.name}</h1>
        <div className="mb-4 text-cyan-300">
          <Price amount={p.unitAmount} currency={p.currency} />
        </div>
        <p className="mb-6 text-slate-300">{p.description}</p>
        <AddToCart productId={p.id} />
      </div>
    </div>
  );
}
