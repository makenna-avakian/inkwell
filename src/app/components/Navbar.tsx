import Link from "next/link";
import { auth } from "@/server/auth/config";
import { isSeller } from "@/server/shops/service";
import UserMenu from "@/app/components/UserMenu";

/**
 * Navbar — Browse/Search links added by Unit 4 (Discovery). Signed-in users
 * get a UserMenu dropdown (avatar icon) instead of inline links; "My Shop"
 * lives inside it and is gated on isSeller rather than shown to every
 * signed-in user.
 */
export default async function Navbar() {
  const session = await auth();
  const sellerFlag = session?.user?.id ? await isSeller(session.user.id) : false;

  return (
    <header className="fixed top-0 left-0 z-40 w-full border-b-2 border-foreground bg-surface">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-3xl font-semibold tracking-tight text-foreground italic">
          Inkwell
        </Link>

        <div className="flex items-center gap-7 text-xs font-medium tracking-[0.12em] text-foreground uppercase">
          <Link
            href="/gallery"
            data-testid="navbar-gallery-link"
            className="transition-colors hover:text-accent"
          >
            Browse
          </Link>
          <Link
            href="/search"
            data-testid="navbar-search-link"
            className="transition-colors hover:text-accent"
          >
            Find an Artist
          </Link>
          {session?.user ? (
            <UserMenu displayName={session.user.name ?? "Account"} isSeller={sellerFlag} />
          ) : (
            <>
              <Link
                href="/sign-in"
                data-testid="navbar-sign-in-link"
                className="transition-colors hover:text-accent"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                data-testid="navbar-sign-up-link"
                className="border border-foreground px-4 py-2 transition-colors hover:border-accent hover:text-accent"
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
