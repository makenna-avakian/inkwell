"use server";

import { auth } from "@/server/auth/config";
import {
  acceptRequest,
  declineRequest,
  getRequestWithMessages,
  joinWaitlist,
  markRequestSeen,
  postMessage,
  requestReferenceImageUpload,
  submitRequest,
} from "@/server/requests/service";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return session.user.id;
}

export interface RequestFormState {
  formError?: string;
  success?: boolean;
}

export async function submitRequestAction(
  shopId: string,
  _prevState: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  try {
    const buyerId = await requireSession();
    await submitRequest(buyerId, shopId, {
      tierId: String(formData.get("tierId") ?? ""),
      description: String(formData.get("description") ?? ""),
      budgetCents: formData.get("budget")
        ? Math.round(Number(formData.get("budget")) * 100)
        : undefined,
      deadlinePreference: String(formData.get("deadlinePreference") ?? "") || undefined,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { formError: error.message };
    }
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function joinWaitlistAction(shopId: string): Promise<RequestFormState> {
  try {
    const buyerId = await requireSession();
    await joinWaitlist(buyerId, shopId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function acceptRequestAction(requestId: string): Promise<RequestFormState> {
  try {
    const userId = await requireSession();
    await acceptRequest(requestId, userId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function declineRequestAction(
  requestId: string,
  reason: string,
): Promise<RequestFormState> {
  try {
    const userId = await requireSession();
    await declineRequest(requestId, userId, reason);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function postMessageAction(
  requestId: string,
  body: string,
): Promise<RequestFormState> {
  try {
    const userId = await requireSession();
    await postMessage(requestId, userId, body);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function markRequestSeenAction(requestId: string): Promise<void> {
  const userId = await requireSession();
  await markRequestSeen(requestId, userId);
}

/** Used by MessageThread's polling (nfr-requirements.md Question 1: B). */
export async function getMessagesAction(requestId: string) {
  const userId = await requireSession();
  const { messages } = await getRequestWithMessages(requestId, userId);
  return messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function requestReferenceUploadAction(
  fileName: string,
  contentType: string,
  sizeBytes: number,
): Promise<{ uploadUrl?: string; imageUrl?: string; error?: string }> {
  try {
    await requireSession();
    const { uploadUrl, imageUrl } = await requestReferenceImageUpload(
      fileName,
      contentType,
      sizeBytes,
    );
    return { uploadUrl, imageUrl };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Couldn't start upload. Please try again." };
  }
}
