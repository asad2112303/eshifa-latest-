/** Shared loading skeletons — avoids large blank screens while data loads. */

const shimmer = "animate-pulse rounded-xl bg-[#E6E9EF]";

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#E6E9EF] bg-white p-6">
          <div className={`${shimmer} h-3 w-24`} />
          <div className={`${shimmer} mt-4 h-8 w-16`} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-[#E6E9EF] bg-white p-4">
      <div className={`${shimmer} mb-4 h-10 w-full max-w-sm`} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-[#F0F2F6] py-4">
          <div className={`${shimmer} h-4 w-20`} />
          <div className={`${shimmer} h-4 flex-1`} />
          <div className={`${shimmer} h-4 w-28`} />
          <div className={`${shimmer} h-6 w-20`} />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className={`${shimmer} h-6 w-40`} />
      <div className={`${shimmer} h-4 w-full`} />
      <div className={`${shimmer} h-4 w-3/4`} />
      <div className={`${shimmer} h-24 w-full`} />
    </div>
  );
}
