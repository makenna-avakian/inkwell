import Link from "next/link";
import SignUpForm from "@/app/components/auth/SignUpForm";
import { sanitizeCallbackUrl } from "@/server/auth/redirect";

interface SignUpPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
      <h1 className="mb-8 font-serif text-4xl font-medium tracking-tight">Create your Inkwell account</h1>
      <SignUpForm callbackUrl={callbackUrl} />
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
