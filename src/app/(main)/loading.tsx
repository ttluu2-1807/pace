// Shown instantly on tab navigation while the page's async server component
// fetches data. Keeps perceived latency near zero on mobile.
export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          <div className="h-7 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Day selector strip */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-14 w-11 shrink-0 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>

      {/* Banner / primary card */}
      <div className="h-16 rounded-xl bg-muted animate-pulse" />

      {/* Section cards */}
      <div className="space-y-3">
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}
