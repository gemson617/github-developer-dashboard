
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { X } from "lucide-react";
import { useEffect } from "react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: "◫" },
  { name: "Repositories", href: "/dashboard/repositories", icon: "▤" },
  { name: "Contributions", href: "/dashboard/contributions", icon: "▦" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "↗" },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isConnected = status === "authenticated";
  const isLoading = status === "loading";

  // Close sidebar when navigating
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Close sidebar using Escape key
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, onClose]);

  const sidebarContent = (
    <>
      <Link
        href="/dashboard"
        onClick={onClose}
        className="mb-10 flex items-center gap-3 px-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
          D
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            DevBoard
          </h1>
          <p className="text-xs text-zinc-500">
            Developer workspace
          </p>
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
              onClick={onClose}
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
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-400 transition hover:text-blue-300"
            >
              Open GitHub <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() =>
                signIn("github", { callbackUrl: "/dashboard" })
              }
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500"
            >
              Connect GitHub <span aria-hidden="true">↗</span>
            </button>
          )
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-full flex-col border-r border-zinc-800 bg-[#0c0c0e] px-4 py-6 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 md:hidden ${
          mobileOpen
            ? "visible opacity-100"
            : "invisible opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile sidebar drawer */}
      <aside
        id="mobile-sidebar"
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-zinc-800 bg-[#0c0c0e] px-4 py-6 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            tabIndex={mobileOpen ? 0 : -1}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sidebarContent}
      </aside>
    </>
  );
}
