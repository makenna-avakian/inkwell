import Link from "next/link";
import SignUpForm from "@/app/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
      <h1 className="mb-8 font-serif text-4xl font-medium tracking-tight">Create your Inkwell account</h1>
      <SignUpForm />
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4 hover:text-accent">
          Sign in
        </Link>
      </p>
    </main>
  );
}
