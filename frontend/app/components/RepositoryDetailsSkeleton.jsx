export default function RepositoryDetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb and repository header */}
      <div className="space-y-4">
        <div className="h-4 w-40 rounded bg-zinc-800" />

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-3">
            <div className="h-8 w-64 max-w-full rounded bg-zinc-800" />
            <div className="h-4 w-80 max-w-full rounded bg-zinc-800" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-zinc-800" />
              <div className="h-6 w-24 rounded-full bg-zinc-800" />
            </div>
          </div>

          <div className="h-10 w-36 rounded-lg bg-zinc-800" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5"
          >
            <div className="h-4 w-24 rounded bg-zinc-800" />
            <div className="mt-4 h-7 w-16 rounded bg-zinc-800" />
            <div className="mt-3 h-3 w-28 rounded bg-zinc-800/70" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 xl:col-span-2">
          <div className="h-5 w-40 rounded bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-800" />
          <div className="h-4 w-5/6 rounded bg-zinc-800" />
          <div className="h-4 w-2/3 rounded bg-zinc-800" />
          <div className="mt-6 h-32 rounded-lg bg-zinc-800/60" />
        </div>

        <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="h-5 w-40 rounded bg-zinc-800" />
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-3 w-24 rounded bg-zinc-800" />
              <div className="h-4 w-32 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
