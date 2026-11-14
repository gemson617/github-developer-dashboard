
"use client";
import { UserRound } from "lucide-react";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import ConnectGitHub from "./ConnectGitHub";

export default function Header() {
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoggedIn = status === "authenticated";

  return (
    <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-4 border-b border-zinc-800 bg-[#0c0c0e] px-5 py-4 sm:px-8">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Developer Dashboard
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Your GitHub activity at a glance
        </p>
      </div>

      <div className="flex items-center gap-3">
        {!isLoggedIn && status !== "loading" && (
          <ConnectGitHub />
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white"
          >
            {isLoggedIn && user?.image ? (
              <img
                src={user.image}
                alt="GitHub profile"
                className="h-full w-full object-cover"
              />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || <UserRound className="h-5 w-5 text-zinc-400" />
            )}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-zinc-800 bg-[#141416] p-3 shadow-xl">
              {isLoggedIn ? (
                <>
                  <div className="border-b border-zinc-800 px-2 pb-3">
                    <p className="truncate text-sm font-semibold text-white">
                      {user?.username || user?.name || "GitHub user"}
                    </p>
                    <p className="mt-1 break-words text-xs text-zinc-400">
                      {user?.email || "No public email available"}
                    </p>
                    {user?.name && user?.username && (
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {user.name}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-zinc-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="p-2">
                  <p className="text-sm font-medium text-white">
                    Not connected
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Connect your GitHub account to get started.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
