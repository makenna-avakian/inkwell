import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/requests/service", () => ({
  submitRequest: vi.fn(),
  joinWaitlist: vi.fn(),
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  postMessage: vi.fn(),
  markRequestSeen: vi.fn(),
  requestReferenceImageUpload: vi.fn(),
}));

import { auth } from "@/server/auth/config";
import { acceptRequest, declineRequest, submitRequest } from "@/server/requests/service";
import { acceptRequestAction, declineRequestAction, submitRequestAction } from "./actions";

const mockAuth = vi.mocked(auth);
const mockSubmitRequest = vi.mocked(submitRequest);
const mockAcceptRequest = vi.mocked(acceptRequest);
const mockDeclineRequest = vi.mocked(declineRequest);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "buyer-1" } } as never);
});

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("submitRequestAction", () => {
  it("converts dollars to cents for the budget field", async () => {
    await submitRequestAction(
      "shop-1",
      { fieldErrors: {} } as never,
      formData({ tierId: "t1", description: "A piece", budget: "50" }),
    );
    expect(mockSubmitRequest).toHaveBeenCalledWith(
      "buyer-1",
      "shop-1",
      expect.objectContaining({ budgetCents: 5000 }),
    );
  });

  it("surfaces the service's error message", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("Selected tier or add-ons are not offered by this shop."));
    const result = await submitRequestAction(
      "shop-1",
      { fieldErrors: {} } as never,
      formData({ tierId: "bad", description: "x" }),
    );
    expect(result.formError).toBe("Selected tier or add-ons are not offered by this shop.");
  });
});

describe("acceptRequestAction / declineRequestAction", () => {
  it("calls through with the signed-in user id", async () => {
    await acceptRequestAction("req-1");
    expect(mockAcceptRequest).toHaveBeenCalledWith("req-1", "buyer-1");
  });

  it("passes the decline reason through", async () => {
    await declineRequestAction("req-1", "Not my style");
    expect(mockDeclineRequest).toHaveBeenCalledWith("req-1", "buyer-1", "Not my style");
  });
});
