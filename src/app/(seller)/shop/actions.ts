"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import {
  NotPortfolioImageOwnerError,
  NotShopOwnerError,
  PortfolioImageValidationError,
  ShopAlreadyExistsError,
  confirmAvatarImage,
  confirmBannerImage,
  confirmPortfolioImage,
  createShop,
  deletePortfolioImage,
  requestAvatarUploadUrl,
  requestBannerUploadUrl,
  requestPortfolioUploadUrl,
  reorderPortfolioImages,
  setFeaturedPortfolioImage,
  updatePortfolioImage,
  updateShop,
  type PortfolioImageMetadataInput,
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

const socialLinkSchema = z.object({ label: z.string().min(1), url: z.string().url() });
const socialLinksFieldSchema = z.array(socialLinkSchema).default([]);

/** The editor submits social links as a JSON string in a hidden field — malformed input falls back to an empty list rather than reaching the service layer raw. */
function parseSocialLinks(raw: FormDataEntryValue | null) {
  if (!raw) return [];
  try {
    const result = socialLinksFieldSchema.safeParse(JSON.parse(String(raw)));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

const shopFormSchema = z.object({
  shopName: z.string().trim().max(80).optional(),
  bio: z.string().max(2000).optional(),
});

export async function createShopAction(
  _prevState: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  try {
    const userId = await requireSession();
    const shopName = String(formData.get("shopName") ?? "") || undefined;
    const bio = String(formData.get("bio") ?? "") || undefined;
    const socialLinks = parseSocialLinks(formData.get("socialLinks"));
    await createShop(userId, { shopName, bio, socialLinks });
  } catch (error) {
    if (error instanceof ShopAlreadyExistsError) {
      return { fieldErrors: {}, formError: error.message };
    }
    return { fieldErrors: {}, formError: "Something went wrong. Please try again." };
  }
  // Outside the try/catch — redirect() throws internally, and that throw
  // must propagate to Next.js rather than being caught as a generic error.
  redirect("/shop");
}

export async function updateShopAction(
  shopId: string,
  _prevState: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  try {
    const userId = await requireSession();
    const parsed = shopFormSchema.safeParse({
      shopName: String(formData.get("shopName") ?? "") || undefined,
      bio: String(formData.get("bio") ?? "") || undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") fieldErrors[field] = issue.message;
      }
      return { fieldErrors };
    }
    const socialLinks = parseSocialLinks(formData.get("socialLinks"));
    await updateShop(shopId, userId, {
      shopName: parsed.data.shopName,
      bio: parsed.data.bio,
      socialLinks,
    });
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
  uploadFields?: Record<string, string>;
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
    const { uploadUrl, uploadFields, imageUrl } = await requestPortfolioUploadUrl(
      shopId,
      userId,
      fileName,
      contentType,
      sizeBytes,
    );
    return { uploadUrl, uploadFields, imageUrl };
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
  metadata?: Partial<PortfolioImageMetadataInput>,
): Promise<{ error?: string; id?: string }> {
  try {
    const userId = await requireSession();
    const image = await confirmPortfolioImage(shopId, userId, imageUrl, metadata);
    return { id: image.id };
  } catch (error) {
    if (error instanceof NotShopOwnerError || error instanceof PortfolioImageValidationError) {
      return { error: error.message };
    }
    return { error: "Couldn't save the image. Please try again." };
  }
}

export async function updatePortfolioImageAction(
  shopId: string,
  imageId: string,
  metadata: Partial<PortfolioImageMetadataInput>,
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await updatePortfolioImage(shopId, userId, imageId, metadata);
    return {};
  } catch (error) {
    if (error instanceof NotPortfolioImageOwnerError || error instanceof PortfolioImageValidationError) {
      return { error: error.message };
    }
    return { error: "Couldn't save the changes. Please try again." };
  }
}

export async function deletePortfolioImageAction(
  shopId: string,
  imageId: string,
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await deletePortfolioImage(shopId, userId, imageId);
    return {};
  } catch (error) {
    if (error instanceof NotPortfolioImageOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't delete the piece. Please try again." };
  }
}

export async function reorderPortfolioImagesAction(
  shopId: string,
  orderedImageIds: string[],
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await reorderPortfolioImages(shopId, userId, orderedImageIds);
    return {};
  } catch (error) {
    if (error instanceof NotShopOwnerError || error instanceof PortfolioImageValidationError) {
      return { error: error.message };
    }
    return { error: "Couldn't save the new order. Please try again." };
  }
}

export async function setFeaturedPortfolioImageAction(
  shopId: string,
  imageId: string,
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await setFeaturedPortfolioImage(shopId, userId, imageId);
    return {};
  } catch (error) {
    if (error instanceof NotPortfolioImageOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't feature this piece. Please try again." };
  }
}

export async function requestBannerUploadUrlAction(
  shopId: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
): Promise<RequestUploadResult> {
  try {
    const userId = await requireSession();
    const { uploadUrl, uploadFields, imageUrl } = await requestBannerUploadUrl(
      shopId,
      userId,
      fileName,
      contentType,
      sizeBytes,
    );
    return { uploadUrl, uploadFields, imageUrl };
  } catch (error) {
    if (error instanceof InvalidImageError || error instanceof NotShopOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't start upload. Please try again." };
  }
}

export async function confirmBannerImageAction(
  shopId: string,
  imageUrl: string,
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await confirmBannerImage(shopId, userId, imageUrl);
    return {};
  } catch (error) {
    if (error instanceof NotShopOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't save the image. Please try again." };
  }
}

export async function requestAvatarUploadUrlAction(
  shopId: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
): Promise<RequestUploadResult> {
  try {
    const userId = await requireSession();
    const { uploadUrl, uploadFields, imageUrl } = await requestAvatarUploadUrl(
      shopId,
      userId,
      fileName,
      contentType,
      sizeBytes,
    );
    return { uploadUrl, uploadFields, imageUrl };
  } catch (error) {
    if (error instanceof InvalidImageError || error instanceof NotShopOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't start upload. Please try again." };
  }
}

export async function confirmAvatarImageAction(
  shopId: string,
  imageUrl: string,
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await confirmAvatarImage(shopId, userId, imageUrl);
    return {};
  } catch (error) {
    if (error instanceof NotShopOwnerError) {
      return { error: error.message };
    }
    return { error: "Couldn't save the image. Please try again." };
  }
}
