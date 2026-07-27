import Link from "next/link";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center p-8 pt-28 text-center">
        <p className="mb-6 text-xs font-medium tracking-[0.2em] text-accent uppercase">
          A Commission-First Marketplace
        </p>
        <h1 className="mb-8 max-w-3xl font-serif text-7xl leading-[0.95] font-medium tracking-tight text-foreground">
          Original work,
          <br />
          <span className="italic">made to order.</span>
        </h1>
        <p className="mx-auto max-w-md text-base text-muted">
          Browse open shops, commission a custom piece, or buy something ready
          to ship — direct from independent artists.
        </p>
        <div className="mt-10 flex items-center gap-3">
          <Link
            href="/gallery"
            className="border border-foreground bg-foreground px-7 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
          >
            Browse Artwork
          </Link>
          <Link
            href="/sign-up"
            className="border border-foreground px-7 py-3 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
          >
            Open a Shop
          </Link>
        </div>
      </main>
    </>
  );
}
