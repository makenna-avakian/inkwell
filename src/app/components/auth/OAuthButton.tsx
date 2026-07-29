import { signInWithGoogleAction } from "@/app/(auth)/oauth-actions";

interface OAuthButtonProps {
  provider: "google";
  callbackUrl?: string;
}

/** Only "google" in Phase 1 (Functional Design Question 3: B) — Apple deferred. */
export default function OAuthButton({ provider, callbackUrl = "/" }: OAuthButtonProps) {
  const label = provider === "google" ? "Continue with Google" : provider;
  const action = signInWithGoogleAction.bind(null, callbackUrl);

  return (
    <form action={action}>
      <button
        type="submit"
        data-testid={`oauth-${provider}-button`}
        className="w-full border border-border py-3 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
      >
        {label}
      </button>
    </form>
  );
}
