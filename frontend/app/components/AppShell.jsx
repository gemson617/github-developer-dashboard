
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
        <div className="hidden md:block">
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <Header />

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