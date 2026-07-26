import { z } from "zod";
import { hashPassword } from "@/server/auth/password";
import { getRequiredDelaySeconds } from "@/server/auth/rate-limit";
import {
  createUser,
  findUserByEmail,
  getRecentLoginAttempts,
  recordLoginAttempt,
} from "@/server/auth/repository";
import { isSeller } from "@/server/shops/service";

/** BR-1: email format validation. BR-2: password minimum length (breach-list
 *  check happens server-side in Auth.js's Credentials `authorize`, not here,
 *  to keep this schema reusable for both sign-up and future password-change flows). */
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(60).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class RateLimitedError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Too many attempts. Try again in ${retryAfterSeconds}s.`);
    this.name = "RateLimitedError";
  }
}

/** BR-4: default display name to the email's local-part when not supplied. */
export function defaultDisplayName(email: string): string {
  const [localPart] = email.split("@");
  return localPart;
}

export async function signUp(input: SignUpInput) {
  const parsed = signUpSchema.parse(input);

  const existing = await findUserByEmail(parsed.email);
  if (existing) {
    throw new EmailAlreadyRegisteredError();
  }

  const passwordHash = await hashPassword(parsed.password);
  const displayName = parsed.displayName?.trim() || defaultDisplayName(parsed.email);

  return createUser({
    email: parsed.email,
    passwordHash,
    displayName,
  });
}

/**
 * BR-6: check the progressive-delay gate BEFORE attempting password
 * comparison. Throws RateLimitedError if the caller must wait.
 * Caller (Auth.js Credentials `authorize`) is responsible for calling
 * recordLoginAttemptOutcome() after the actual credential check.
 */
export async function assertNotRateLimited(email: string): Promise<void> {
  const recentAttempts = await getRecentLoginAttempts(email);
  const retryAfterSeconds = getRequiredDelaySeconds(
    recentAttempts.map((a) => ({
      succeeded: a.succeeded,
      attemptedAt: a.attemptedAt,
    })),
  );
  if (retryAfterSeconds > 0) {
    throw new RateLimitedError(retryAfterSeconds);
  }
}

export async function recordLoginAttemptOutcome(
  email: string,
  succeeded: boolean,
): Promise<void> {
  // Recorded even for unknown emails — BR: enumeration prevention
  // (business-logic-model.md's Sign-In workflow, step 3).
  await recordLoginAttempt(email, succeeded);
}

/**
 * BR-8 (this module) / BR-8 (unit-2-shops): re-exported so callers can keep
 * using `isSeller` from the Auth module as originally specified in
 * business-logic-model.md — Unit 2 supplies the actual implementation
 * (ShopProfile existence check) now that its schema exists.
 */
export { isSeller };
