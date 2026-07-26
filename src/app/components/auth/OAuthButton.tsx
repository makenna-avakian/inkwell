import { signInWithGoogleAction } from "@/app/(auth)/oauth-actions";

interface OAuthButtonProps {
  provider: "google";
}

/** Only "google" in Phase 1 (Functional Design Question 3: B) — Apple deferred. */
export default function OAuthButton({ provider }: OAuthButtonProps) {
  const label = provider === "google" ? "Continue with Google" : provider;

  return (
    <form action={signInWithGoogleAction}>
      <button
        type="submit"
        data-testid={`oauth-${provider}-button`}
        className="w-full rounded-lg border border-gray-300 py-3 font-medium transition hover:bg-gray-50"
      >
        {label}
      </button>
    </form>
  );
}
