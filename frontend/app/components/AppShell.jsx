
"use client";

import { useCallback, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">

        {/* Sidebar - Desktop and Mobile */}
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={closeSidebar}
        />

        {/* Main Content */}
        <div className="flex min-w-0 flex-col">
          <Header
            onMenuClick={() => setMobileOpen(true)}
          />

          <main className="flex-1 p-5 sm:p-8">
            {children}
          </main>

          <footer className="border-t border-zinc-800 px-5 py-4 text-center text-xs text-zinc-600 sm:px-8">
            DevBoard · Built for developers
          </footer>
        </div>

      </div>
    </div>
  );
}
