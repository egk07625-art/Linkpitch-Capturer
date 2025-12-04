/**
 * @file app-shell.tsx
 * @description App Shell 래퍼 컴포넌트
 */

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      {/* Sidebar (Desktop) */}
      <Sidebar />

      {/* Top Bar (Mobile) */}
      <div className="fixed top-0 left-0 right-0 z-30 h-14 border-b border-zinc-800 flex items-center px-4 bg-zinc-950/80 backdrop-blur-md md:hidden">
        <MobileNav />
        <div className="flex-1 text-center">
          <span className="text-lg font-semibold text-zinc-50">LinkPitch</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:pl-64 pt-14 md:pt-0 min-h-screen max-w-none flex flex-col">
        <div className="flex-1 w-full h-full overflow-y-auto bg-[#050505]">{children}</div>
      </main>
    </div>
  );
}
