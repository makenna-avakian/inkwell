/**
 * Validates a post-sign-in redirect target so it can only ever point back
 * into this app — an unchecked callbackUrl (e.g. from a query param) is a
 * classic open-redirect vector, letting a phishing link like
 * `/sign-in?callbackUrl=https://evil.example.com` bounce a freshly
 * authenticated user off to an attacker-controlled site. Only a path that
 * starts with a single `/` (not `//`, which browsers treat as protocol-
 * relative) and contains no `://` is accepted; anything else falls back
 * to `/`.
 */
export function sanitizeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.includes("://")) return "/";
  return raw;
}

/** Builds a /sign-in URL that carries the current page as the post-sign-in redirect target. */
export function signInUrlWithCallback(callbackUrl: string): string {
  return `/sign-in?callbackUrl=${encodeURIComponent(sanitizeCallbackUrl(callbackUrl))}`;
}
