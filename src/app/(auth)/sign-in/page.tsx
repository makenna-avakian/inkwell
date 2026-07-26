import Link from "next/link";
import SignInForm from "@/app/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-gray-900">
      <h1 className="mb-6 text-3xl font-bold">Sign in to Inkwell</h1>
      <SignInForm />
      <p className="mt-6 text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
