import Link from "next/link";
import { auth } from "@/server/auth/config";
import { signOutAction } from "@/app/components/auth/sign-out-action";

/**
 * Navbar — Browse/Search links added by Unit 4 (Discovery). Seller-specific
 * links (Shop, Listings) are only shown for signed-in sellers once Unit 2/3
 * pages exist for them; kept as plain always-visible links for Phase 1
 * simplicity rather than gating on isSeller (a signed-out or non-seller user
 * just gets redirected by those pages' own auth checks, per Unit 2/3's
 * page-level redirect logic).
 */
export default async function Navbar() {
  const session = await auth();

  return (
    <header className="fixed top-0 left-0 z-40 w-full border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-black">
          Inkwell
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/gallery" data-testid="navbar-gallery-link">
            Browse
          </Link>
          <Link href="/search" data-testid="navbar-search-link">
            Find an artist
          </Link>
          {session?.user && (
            <Link href="/shop" data-testid="navbar-shop-link">
              My shop
            </Link>
          )}

          {session?.user ? (
            <>
              <span data-testid="navbar-display-name">{session.user.name}</span>
              <form action={signOutAction}>
                <button type="submit" data-testid="navbar-sign-out-button">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" data-testid="navbar-sign-in-link">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                data-testid="navbar-sign-up-link"
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
