'use client';

import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const HIDDEN_PREFIXES = ["/app"];

const Navbar = () => {
  const pathname = usePathname();
  const shouldHide = pathname ? HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) : false;

  if (shouldHide) {
    return null;
  }

  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
      <Link href="/" className="text-2xl font-bold">
        Linkpitch
      </Link>
      <div className="flex gap-4 items-center">
        <SignedOut>
          <Link href="/sign-in">
            <Button>로그인</Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
