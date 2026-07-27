"use server";

import { auth } from "@/server/auth/config";
import {
  acceptAndCreateOrder,
  approveDelivery,
  cancelOrder,
  checkout,
  getCheckoutUrlForOrder,
  getOrderHistoryForBuyer,
  getOrderHistoryForSeller,
  markInProgress,
  onboardSellerAction,
  requestRevision,
  submitForReview,
} from "@/server/orders/service";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return session.user.id;
}

export interface OrderActionState {
  formError?: string;
  checkoutUrl?: string;
  success?: boolean;
}

export async function acceptAndCreateOrderAction(requestId: string): Promise<OrderActionState> {
  try {
    const sellerId = await requireSession();
    const { checkoutUrl } = await acceptAndCreateOrder(requestId, sellerId);
    return { success: true, checkoutUrl };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function checkoutAction(listingId: string): Promise<OrderActionState> {
  try {
    const buyerId = await requireSession();
    const { checkoutUrl } = await checkout(listingId, buyerId);
    return { success: true, checkoutUrl };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function onboardSellerActionAction(shopId: string): Promise<OrderActionState> {
  try {
    const userId = await requireSession();
    const onboardingUrl = await onboardSellerAction(shopId, userId);
    return { success: true, checkoutUrl: onboardingUrl };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function payOrderAction(orderId: string): Promise<OrderActionState> {
  try {
    const buyerId = await requireSession();
    const checkoutUrl = await getCheckoutUrlForOrder(orderId, buyerId);
    return { success: true, checkoutUrl };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function markInProgressAction(orderId: string): Promise<OrderActionState> {
  try {
    const userId = await requireSession();
    await markInProgress(orderId, userId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function submitForReviewAction(orderId: string): Promise<OrderActionState> {
  try {
    const userId = await requireSession();
    await submitForReview(orderId, userId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function requestRevisionAction(
  orderId: string,
  feedback: string,
): Promise<OrderActionState> {
  try {
    const userId = await requireSession();
    await requestRevision(orderId, userId, feedback);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function approveDeliveryAction(orderId: string): Promise<OrderActionState> {
  try {
    const userId = await requireSession();
    await approveDelivery(orderId, userId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function cancelOrderAction(orderId: string): Promise<OrderActionState> {
  try {
    const userId = await requireSession();
    await cancelOrder(orderId, userId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) return { formError: error.message };
    return { formError: "Something went wrong. Please try again." };
  }
}

export async function getMyOrdersAsBuyerAction() {
  const userId = await requireSession();
  return getOrderHistoryForBuyer(userId);
}

export async function getMyOrdersAsSellerAction() {
  const userId = await requireSession();
  return getOrderHistoryForSeller(userId);
}
