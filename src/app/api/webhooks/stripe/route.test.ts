import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/orders/payment", () => ({
  constructWebhookEvent: vi.fn(),
}));
vi.mock("@/server/orders/service", () => ({
  handleWebhookEvent: vi.fn(),
}));

import { constructWebhookEvent } from "@/server/orders/payment";
import { handleWebhookEvent } from "@/server/orders/service";
import { POST } from "./route";

const mockConstructWebhookEvent = vi.mocked(constructWebhookEvent);
const mockHandleWebhookEvent = vi.mocked(handleWebhookEvent);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: string, signature?: string) {
  return new NextRequest("https://example.com/api/webhooks/stripe", {
    method: "POST",
    headers: signature ? { "stripe-signature": signature } : {},
    body,
  });
}

describe("POST /api/webhooks/stripe", () => {
  it("rejects requests with no signature header", async () => {
    const response = await POST(makeRequest("{}"));
    expect(response.status).toBe(400);
    expect(mockHandleWebhookEvent).not.toHaveBeenCalled();
  });

  it("rejects a request whose signature fails verification", async () => {
    mockConstructWebhookEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    const response = await POST(makeRequest("{}", "bad-sig"));
    expect(response.status).toBe(400);
    expect(mockHandleWebhookEvent).not.toHaveBeenCalled();
  });

  it("dispatches the verified event to handleWebhookEvent (BR-7 idempotency lives one layer down)", async () => {
    const event = { id: "evt_1", type: "checkout.session.completed" };
    mockConstructWebhookEvent.mockReturnValue(event as never);

    const response = await POST(makeRequest("{}", "good-sig"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mockHandleWebhookEvent).toHaveBeenCalledWith(event);
  });
});
