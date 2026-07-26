import Link from "next/link";
import SignUpForm from "@/app/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-gray-900">
      <h1 className="mb-6 text-3xl font-bold">Create your Inkwell account</h1>
      <SignUpForm />
      <p className="mt-6 text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
