"use server";

import { signIn } from "@/server/auth/config";
import { sanitizeCallbackUrl } from "@/server/auth/redirect";

export async function signInWithGoogleAction(callbackUrl: string) {
  await signIn("google", { redirectTo: sanitizeCallbackUrl(callbackUrl) });
}
