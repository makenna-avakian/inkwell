import Link from "next/link";
import SignInForm from "@/app/components/auth/SignInForm";
import { sanitizeCallbackUrl } from "@/server/auth/redirect";

interface SignInPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
      <h1 className="mb-8 font-serif text-4xl font-medium tracking-tight">Sign in to Inkwell</h1>
      <SignInForm callbackUrl={callbackUrl} />
      <p className="mt-6 text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
        >
          Sign up
        </Link>
      </p>
    </main>
  );
}
