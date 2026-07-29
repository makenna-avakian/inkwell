"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/components/auth/sign-out-action";

interface UserMenuProps {
  displayName: string;
  isSeller: boolean;
}

export default function UserMenu({ displayName, isSeller }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        data-testid="navbar-user-menu-button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground bg-foreground text-xs font-medium text-surface normal-case transition-colors hover:border-accent hover:bg-accent"
      >
        {initial}
      </button>

      {open && (
        <div
          data-testid="navbar-user-menu-dropdown"
          className="absolute right-0 mt-2 w-44 border border-border bg-surface py-1 shadow-sm"
        >
          <p className="truncate border-b border-border px-4 py-2 text-xs text-muted normal-case">
            {displayName}
          </p>
          <Link
            href="/account"
            data-testid="navbar-user-menu-account-link"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-xs tracking-[0.1em] text-foreground uppercase transition-colors hover:text-accent"
          >
            Account
          </Link>
          {isSeller ? (
            <Link
              href="/shop"
              data-testid="navbar-user-menu-shop-link"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-xs tracking-[0.1em] text-foreground uppercase transition-colors hover:text-accent"
            >
              My Shop
            </Link>
          ) : (
            <Link
              href="/shop/new"
              data-testid="navbar-user-menu-open-shop-link"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-xs tracking-[0.1em] text-foreground uppercase transition-colors hover:text-accent"
            >
              Open a Shop
            </Link>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              data-testid="navbar-user-menu-sign-out-button"
              className="block w-full px-4 py-2 text-left text-xs tracking-[0.1em] text-foreground uppercase transition-colors hover:text-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
