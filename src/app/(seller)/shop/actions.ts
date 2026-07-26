"use server";

import { z } from "zod";
import { auth } from "@/server/auth/config";
import {
  NotShopOwnerError,
  ShopAlreadyExistsError,
  confirmPortfolioImage,
  createShop,
  requestPortfolioUploadUrl,
  updateShop,
} from "@/server/shops/service";
import { InvalidImageError } from "@/server/shops/storage";

export interface ShopActionState {
  fieldErrors: Record<string, string>;
  formError?: string;
}

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return session.user.id;
}

const createShopFormSchema = z.object({
  bio: z.string().max(2000).optional(),
});

export async function createShopAction(
  _prevState: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  try {
    const userId = await requireSession();
    const bio = String(formData.get("bio") ?? "") || undefined;
    await createShop(userId, { bio, socialLinks: [] });
  } catch (error) {
    if (error instanceof ShopAlreadyExistsError) {
      return { fieldErrors: {}, formError: error.message };
    }
    return { fieldErrors: {}, formError: "Something went wrong. Please try again." };
  }
  return { fieldErrors: {} };
}

export async function updateShopAction(
  shopId: string,
  _prevState: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  try {
    const userId = await requireSession();
    const parsed = createShopFormSchema.safeParse({
      bio: String(formData.get("bio") ?? "") || undefined,
    });
    if (!parsed.success) {
      return { fieldErrors: { bio: parsed.error.issues[0]?.message ?? "Invalid" } };
    }
    await updateShop(shopId, userId, { bio: parsed.data.bio });
  } catch (error) {
    if (error instanceof NotShopOwnerError) {
      return { fieldErrors: {}, formError: error.message };
    }
    return { fieldErrors: {}, formError: "Something went wrong. Please try again." };
  }
  return { fieldErrors: {} };
}

export interface RequestUploadResult {
  uploadUrl?: string;
  imageUrl?: string;
  error?: string;
}

export async function requestPortfolioUploadUrlAction(
  shopId: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
): Promise<RequestUploadResult> {
  try {
    const userId = await requireSession();
    const { uploadUrl, imageUrl } = await requestPortfolioUploadUrl(
      shopId,
      userId,
      fileName,
      contentType,
      sizeBytes,
    );
    return { uploadUrl, imageUrl };
  } catch (error) {
    if (error instanceof InvalidImageError || error instanceof NotShopOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't start upload. Please try again." };
  }
}

export async function confirmPortfolioImageAction(
  shopId: string,
  imageUrl: string,
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await confirmPortfolioImage(shopId, userId, imageUrl);
    return {};
  } catch (error) {
    if (error instanceof NotShopOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't save the image. Please try again." };
  }
}
