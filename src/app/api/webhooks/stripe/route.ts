import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/server/orders/payment";
import { handleWebhookEvent } from "@/server/orders/service";

/**
 * Stripe webhook target (aidlc-docs/construction/unit-6-orders/infrastructure-design/infrastructure-design.md).
 * The sole server-to-server confirmation path for payment state (NFR-4) — signature-verified, not trusted by URL alone.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await handleWebhookEvent(event);

  return NextResponse.json({ received: true });
}
