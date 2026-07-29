"use server";

import { z } from "zod";
import { signIn } from "@/server/auth/config";
import { EmailAlreadyRegisteredError, signUp } from "@/server/auth/service";
import { sanitizeCallbackUrl } from "@/server/auth/redirect";

export interface SignUpFormState {
  fieldErrors: Partial<Record<"email" | "password" | "displayName", string>>;
  formError?: string;
}

export async function signUpAction(
  _prevState: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "") || undefined;
  const redirectTo = sanitizeCallbackUrl(formData.get("callbackUrl") as string | null);

  try {
    await signUp({ email, password, displayName });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: SignUpFormState["fieldErrors"] = {};
      for (const issue of error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password" || field === "displayName") {
          fieldErrors[field] = issue.message;
        }
      }
      return { fieldErrors };
    }
    if (error instanceof EmailAlreadyRegisteredError) {
      return { fieldErrors: { email: error.message } };
    }
    // SECURITY-09: never surface internal error details to the client.
    return { fieldErrors: {}, formError: "Something went wrong. Please try again." };
  }

  // Auto-sign-in after sign-up (business-logic-model.md).
  await signIn("credentials", { email, password, redirectTo });

  return { fieldErrors: {} };
}
