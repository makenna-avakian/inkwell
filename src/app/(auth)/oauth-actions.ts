"use server";

import { signIn } from "@/server/auth/config";

export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/" });
}
