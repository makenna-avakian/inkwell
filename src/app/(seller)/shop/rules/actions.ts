"use server";

import { auth } from "@/server/auth/config";
import {
  NotShopOwnerError,
  RuleSetValidationError,
  publishRuleSet,
  setSlotState,
  type publishRuleSetSchema,
} from "@/server/shops/service";
import { z } from "zod";

export interface RulesActionState {
  formError?: string;
  success?: boolean;
}

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return session.user.id;
}

export async function publishRuleSetAction(
  shopId: string,
  input: z.infer<typeof publishRuleSetSchema>,
): Promise<RulesActionState> {
  try {
    const userId = await requireSession();
    await publishRuleSet(shopId, userId, input);
    return { success: true };
  } catch (error) {
    if (error instanceof RuleSetValidationError || error instanceof NotShopOwnerError) {
      return { formError: error.message };
    }
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function setSlotStateAction(
  shopId: string,
  slotState: "open" | "closed" | "waitlist",
): Promise<RulesActionState> {
  try {
    const userId = await requireSession();
    await setSlotState(shopId, userId, slotState);
    return { success: true };
  } catch (error) {
    if (error instanceof NotShopOwnerError) {
      return { formError: error.message };
    }
    return { formError: "Something went wrong. Please try again." };
  }
}
