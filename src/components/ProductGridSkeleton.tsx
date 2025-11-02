export default function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/5 p-4 animate-pulse"
        >
          <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-white/10" />
          <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
          <div className="h-4 bg-white/10 rounded mb-3 w-1/2" />
          <div className="h-9 bg-white/10 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

