"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/config";
import { RateLimitedError } from "@/server/auth/service";
import { sanitizeCallbackUrl } from "@/server/auth/redirect";

export interface SignInFormState {
  formError?: string;
  retryAfterSeconds?: number;
}

export async function signInAction(
  _prevState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = sanitizeCallbackUrl(formData.get("callbackUrl") as string | null);

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return {
        formError: `Too many attempts. Try again in ${error.retryAfterSeconds}s.`,
        retryAfterSeconds: error.retryAfterSeconds,
      };
    }
    if (error instanceof AuthError) {
      // Deliberately generic — never distinguish unknown-email from
      // wrong-password (business-logic-model.md, enumeration prevention).
      return { formError: "Invalid email or password." };
    }
    throw error; // Next.js redirect() "errors" must propagate, not be caught.
  }

  return {};
}
