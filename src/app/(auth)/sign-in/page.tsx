import Link from "next/link";
import SignInForm from "@/app/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
      <h1 className="mb-8 font-serif text-4xl font-medium tracking-tight">Sign in to Inkwell</h1>
      <SignInForm />
      <p className="mt-6 text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4 hover:text-accent">
          Sign up
        </Link>
      </p>
    </main>
  );
}
