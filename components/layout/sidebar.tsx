"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { LayoutGrid, Users, Sparkles, Mail, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "대시보드",
    href: "/app",
    icon: LayoutGrid,
  },
  {
    name: "클라이언트 관리",
    href: "/prospects",
    icon: Users,
  },
  {
    name: "시퀀스",
    href: "/app/sequences",
    icon: Sparkles,
  },
  {
    name: "보낸 메일",
    href: "/app/sent",
    icon: Mail,
  },
  {
    name: "로그",
    href: "/app/logs",
    icon: FileText,
  },
  {
    name: "설정",
    href: "/app/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800/50 bg-zinc-950 hidden md:flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center px-6 border-b border-zinc-800/50">
        <Link href="/" className="text-lg font-semibold text-zinc-50">
          LinkPitch
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isRootDashboard = item.href === "/app";
            const isActive = isRootDashboard
              ? pathname === item.href
              : pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-zinc-800/60 text-zinc-50 shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                )}
              >
                <Icon className="size-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - User Info */}
      <div className="p-4 border-t border-zinc-800/50">
        {!isLoaded ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="size-9 rounded-full bg-zinc-800 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-zinc-800 rounded animate-pulse mb-1" />
              <div className="h-3 bg-zinc-800 rounded animate-pulse w-2/3" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-9",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-50 truncate">
                {user.fullName || user.primaryEmailAddress?.emailAddress || 'User'}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 text-center">
            <p className="text-sm text-zinc-400">로그인되지 않음</p>
          </div>
        )}
      </div>
    </aside>
  );
}
