import Link from "next/link";
import { auth } from "@/server/auth/config";
import { signOutAction } from "@/app/components/auth/sign-out-action";

/**
 * Minimal Phase 1 navbar (Unit 1 scope only) — Sign In/Sign Up when logged
 * out, display name + Sign Out when logged in. Marketplace navigation links
 * (Browse, Shops, etc.) are added by later units as those pages exist.
 */
export default async function Navbar() {
  const session = await auth();

  return (
    <header className="fixed top-0 left-0 z-40 w-full border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-black">
          Inkwell
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
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
