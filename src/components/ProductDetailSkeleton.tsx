export default function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2 animate-pulse">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/10" />
      <div className="space-y-4">
        <div className="h-8 bg-white/10 rounded w-3/4" />
        <div className="h-6 bg-white/10 rounded w-1/3" />
        <div className="space-y-2 pt-4">
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-5/6" />
        </div>
        <div className="h-10 bg-white/10 rounded w-32 mt-6" />
      </div>
    </div>
  );
}

