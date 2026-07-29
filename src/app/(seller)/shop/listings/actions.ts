"use server";

import { auth } from "@/server/auth/config";
import {
  ListingValidationError,
  NotListingOwnerError,
  addListingImage,
  confirmListingImage,
  createListing,
  setListingStatus,
  updateListing,
} from "@/server/listings/service";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return session.user.id;
}

/** Style tags are entered as a comma-separated field in the form. */
function parseStyleTags(formData: FormData): string[] {
  return String(formData.get("styleTags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export interface ListingActionState {
  fieldErrors: Record<string, string>;
  formError?: string;
}

export async function createListingAction(
  shopId: string,
  _prevState: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  try {
    await requireSession();
    await createListing(shopId, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      priceCents: Math.round(Number(formData.get("price") ?? 0) * 100),
      medium: String(formData.get("medium") ?? "") || undefined,
      styleTags: parseStyleTags(formData),
    });
  } catch (error) {
    if (error instanceof ListingValidationError) {
      return { fieldErrors: {}, formError: error.message };
    }
    return { fieldErrors: {}, formError: "Something went wrong. Please try again." };
  }
  return { fieldErrors: {} };
}

export async function updateListingAction(
  listingId: string,
  _prevState: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  try {
    const userId = await requireSession();
    await updateListing(listingId, userId, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      priceCents: Math.round(Number(formData.get("price") ?? 0) * 100),
      medium: String(formData.get("medium") ?? "") || undefined,
      styleTags: parseStyleTags(formData),
    });
  } catch (error) {
    if (error instanceof ListingValidationError || error instanceof NotListingOwnerError) {
      return { fieldErrors: {}, formError: error.message };
    }
    return { fieldErrors: {}, formError: "Something went wrong. Please try again." };
  }
  return { fieldErrors: {} };
}

export async function setListingStatusAction(
  listingId: string,
  status: "available" | "sold" | "removed",
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await setListingStatus(listingId, userId, status);
    return {};
  } catch (error) {
    if (error instanceof NotListingOwnerError) {
      return { error: error.message };
    }
    return { error: "Something went wrong. Please try again." };
  }
}

export async function requestListingUploadUrlAction(
  listingId: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
): Promise<{ uploadUrl?: string; imageUrl?: string; error?: string }> {
  try {
    const userId = await requireSession();
    const { uploadUrl, imageUrl } = await addListingImage(
      listingId,
      userId,
      fileName,
      contentType,
      sizeBytes,
    );
    return { uploadUrl, imageUrl };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Couldn't start upload. Please try again." };
  }
}

export async function confirmListingImageAction(
  listingId: string,
  imageUrl: string,
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await confirmListingImage(listingId, userId, imageUrl);
    return {};
  } catch (error) {
    if (error instanceof NotListingOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't save the image. Please try again." };
  }
}
