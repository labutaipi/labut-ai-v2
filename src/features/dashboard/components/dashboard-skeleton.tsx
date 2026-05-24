export function DashboardSkeleton() {
  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <div className="mb-8 h-10 w-64 animate-pulse rounded-xl bg-[var(--line)]" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--line)]" />
        ))}
      </div>
      <div className="mb-6 h-64 animate-pulse rounded-2xl bg-[var(--line)]" />
      <div className="h-48 animate-pulse rounded-2xl bg-[var(--line)]" />
    </main>
  )
}
