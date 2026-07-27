"use server";

import { auth } from "@/server/auth/config";
import { changePassword, updateDisplayName } from "@/server/auth/service";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return session.user.id;
}

export interface AccountActionState {
  formError?: string;
  success?: boolean;
}

export async function updateDisplayNameAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const userId = await requireSession();
    await updateDisplayName(userId, String(formData.get("displayName") ?? ""));
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function changePasswordAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const userId = await requireSession();
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    await changePassword(userId, currentPassword, newPassword);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}
