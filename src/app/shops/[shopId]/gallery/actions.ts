"use server";

import { auth } from "@/server/auth/config";
import {
  NotShopOwnerError,
  PortfolioImageValidationError,
  saveGalleryWallLayout,
} from "@/server/shops/service";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return session.user.id;
}

export interface GalleryWallLayoutInput {
  frameColor: string;
  frameStyle: string;
  pieces: { portfolioImageId: string; x: number; y: number }[];
}

export async function saveGalleryWallLayoutAction(
  shopId: string,
  input: GalleryWallLayoutInput,
): Promise<{ error?: string }> {
  try {
    const userId = await requireSession();
    await saveGalleryWallLayout(shopId, userId, input);
    return {};
  } catch (error) {
    if (error instanceof NotShopOwnerError || error instanceof PortfolioImageValidationError) {
      return { error: error.message };
    }
    return { error: "Couldn't save the gallery wall. Please try again." };
  }
}
