import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#0b0d14]">
      <Sidebar />

      {/* ── Main Content Area ─────────────────────────────────── */}
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between 
                           px-8 py-4 bg-[#0b0d14]/80 backdrop-blur-sm 
                           border-b border-sidebar-border">
          <div />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full 
                            bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">API Bağlı</span>
            </div>
          </div>
        </header>

        {/* Page content — rendered by child routes */}
        <div className="flex-1 p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
