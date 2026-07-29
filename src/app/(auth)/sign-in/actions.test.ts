import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({
  signIn: vi.fn(),
}));
vi.mock("@/server/auth/service", () => ({
  RateLimitedError: class RateLimitedError extends Error {
    constructor(public readonly retryAfterSeconds: number) {
      super(`Too many attempts. Try again in ${retryAfterSeconds}s.`);
    }
  },
}));
// next-auth's real package transitively imports next/server, which vitest's
// jsdom environment can't resolve — mock the one export this action uses
// instead of loading the real package (same issue as MyOrders/SellerTransactions).
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
}));

import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/config";
import { RateLimitedError } from "@/server/auth/service";
import { signInAction } from "./actions";

const mockSignIn = vi.mocked(signIn);

beforeEach(() => {
  vi.clearAllMocks();
});

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("signInAction", () => {
  it("signs in successfully with no error", async () => {
    mockSignIn.mockResolvedValue(undefined as never);

    const result = await signInAction(
      {},
      formData({ email: "a@example.com", password: "password123" }),
    );

    expect(result).toEqual({});
    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ email: "a@example.com", password: "password123", redirectTo: "/" }),
    );
  });

  it("redirects to a valid callbackUrl after sign-in", async () => {
    mockSignIn.mockResolvedValue(undefined as never);

    await signInAction(
      {},
      formData({ email: "a@example.com", password: "password123", callbackUrl: "/shop/new" }),
    );

    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirectTo: "/shop/new" }),
    );
  });

  it("sanitizes an unsafe callbackUrl instead of redirecting off-site (open-redirect protection)", async () => {
    mockSignIn.mockResolvedValue(undefined as never);

    await signInAction(
      {},
      formData({
        email: "a@example.com",
        password: "password123",
        callbackUrl: "https://evil.example.com",
      }),
    );

    expect(mockSignIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ redirectTo: "/" }));
  });

  it("surfaces retryAfterSeconds when rate-limited", async () => {
    mockSignIn.mockRejectedValue(new RateLimitedError(30));

    const result = await signInAction(
      {},
      formData({ email: "a@example.com", password: "password123" }),
    );

    expect(result.retryAfterSeconds).toBe(30);
    expect(result.formError).toContain("30s");
  });

  it("returns a generic error for any AuthError (enumeration-safe)", async () => {
    mockSignIn.mockRejectedValue(new AuthError("CredentialsSignin"));

    const result = await signInAction(
      {},
      formData({ email: "a@example.com", password: "wrong" }),
    );

    expect(result.formError).toBe("Invalid email or password.");
  });

  it("re-throws errors that aren't RateLimitedError or AuthError (e.g. Next.js redirect)", async () => {
    mockSignIn.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(
      signInAction({}, formData({ email: "a@example.com", password: "password123" })),
    ).rejects.toThrow("NEXT_REDIRECT");
  });
});
