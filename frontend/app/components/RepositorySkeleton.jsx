export default function RepositorySkeleton() {
  return (
    <div
      className="dashboard-card animate-pulse p-4 sm:p-5"
      aria-hidden="true"
    >
      {/* Repository name and visibility */}
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-48 rounded bg-zinc-800" />
        <div className="h-6 w-16 rounded-full bg-zinc-800" />
      </div>

      {/* Description */}
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full max-w-lg rounded bg-zinc-800" />
        <div className="h-3 w-2/3 max-w-md rounded bg-zinc-800" />
      </div>

      {/* Language, stars, forks, updated date */}
      <div className="mt-5 flex flex-wrap gap-4">
        <div className="h-3 w-20 rounded bg-zinc-800" />
        <div className="h-3 w-12 rounded bg-zinc-800" />
        <div className="h-3 w-16 rounded bg-zinc-800" />
        <div className="h-3 w-28 rounded bg-zinc-800" />
      </div>
    </div>
  );
}
