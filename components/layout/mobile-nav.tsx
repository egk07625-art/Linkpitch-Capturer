"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, LayoutGrid, Users, Sparkles, Mail, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const navigationItems = [
  {
    name: "대시보드",
    href: "/app",
    icon: LayoutGrid,
  },
  {
    name: "고객사 관리",
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

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-zinc-950 border-zinc-800">
        <SheetHeader className="border-b border-zinc-800/50 pb-4">
          <SheetTitle className="text-lg font-semibold text-zinc-50">
            LinkPitch
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 py-6">
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
                onClick={() => setOpen(false)}
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
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-9",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-50 truncate">Account</p>
              <p className="text-xs text-zinc-400 truncate">Manage settings</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
