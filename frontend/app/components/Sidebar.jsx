
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: "◫" },
  { name: "Repositories", href: "/dashboard/repositories", icon: "▤" },
  { name: "Contributions", href: "/dashboard/contributions", icon: "▦" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "↗" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isConnected = status === "authenticated";
  const isLoading = status === "loading";

  return (
    <aside className="flex h-full w-full flex-col border-r border-zinc-800 bg-[#0c0c0e] px-4 py-6">
      <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
          D
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            DevBoard
          </h1>
          <p className="text-xs text-zinc-500">Developer workspace</p>
        </div>
      </Link>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Workspace
      </p>

      <nav className="space-y-1">
        {navigation.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                active
                  ? "bg-blue-600/15 font-medium text-blue-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span className="w-5 text-center text-lg">
                {item.icon}
              </span>

              {item.name}

              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* GitHub connection status */}
      <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              isLoading
                ? "animate-pulse bg-zinc-500"
                : isConnected
                  ? "bg-emerald-400"
                  : "bg-amber-400"
            }`}
          />

          <p className="text-sm font-medium text-zinc-200">
            {isLoading
              ? "Checking connection..."
              : isConnected
                ? "GitHub Connected"
                : "GitHub Not Connected"}
          </p>
        </div>

        <p className="mt-2 text-xs leading-5 text-zinc-400">
          {isLoading
            ? "Checking your GitHub session."
            : isConnected
              ? `Connected as ${session.user?.username || session.user?.name || "GitHub user"}.`
              : "Connect your GitHub account to load your developer data."}
        </p>

        {!isLoading && (
          isConnected ? (
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-400 transition hover:text-violet-300"
            >
              Open GitHub <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500"
            >
              Connect GitHub <span aria-hidden="true">↗</span>
            </button>
          )
        )}
      </div>
    </aside>
  );
}