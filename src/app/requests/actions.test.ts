import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/requests/service", () => ({
  submitRequest: vi.fn(),
  joinWaitlist: vi.fn(),
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  postMessage: vi.fn(),
  markRequestSeen: vi.fn(),
  getRequestWithMessages: vi.fn(),
  requestReferenceImageUpload: vi.fn(),
}));

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
import {
  acceptRequestAction,
  declineRequestAction,
  getMessagesAction,
  joinWaitlistAction,
  markRequestSeenAction,
  postMessageAction,
  requestReferenceUploadAction,
  submitRequestAction,
} from "./actions";

const mockAuth = vi.mocked(auth);
const mockSubmitRequest = vi.mocked(submitRequest);
const mockAcceptRequest = vi.mocked(acceptRequest);
const mockDeclineRequest = vi.mocked(declineRequest);
const mockJoinWaitlist = vi.mocked(joinWaitlist);
const mockPostMessage = vi.mocked(postMessage);
const mockMarkRequestSeen = vi.mocked(markRequestSeen);
const mockGetRequestWithMessages = vi.mocked(getRequestWithMessages);
const mockRequestReferenceImageUpload = vi.mocked(requestReferenceImageUpload);

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

  it("surfaces a rejection error from acceptRequest", async () => {
    mockAcceptRequest.mockRejectedValue(new Error("Request already responded to."));
    const result = await acceptRequestAction("req-1");
    expect(result.formError).toBe("Request already responded to.");
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    mockAcceptRequest.mockRejectedValue("nope");
    const result = await acceptRequestAction("req-1");
    expect(result.formError).toBe("Something went wrong. Please try again.");
  });
});

describe("joinWaitlistAction", () => {
  it("calls through with the signed-in caller", async () => {
    const result = await joinWaitlistAction("shop-1");
    expect(mockJoinWaitlist).toHaveBeenCalledWith("buyer-1", "shop-1");
    expect(result.success).toBe(true);
  });

  it("surfaces a rejection error", async () => {
    mockJoinWaitlist.mockRejectedValue(new Error("Already on the waitlist."));
    const result = await joinWaitlistAction("shop-1");
    expect(result.formError).toBe("Already on the waitlist.");
  });
});

describe("postMessageAction", () => {
  it("calls through with the signed-in caller", async () => {
    const result = await postMessageAction("req-1", "Hello there");
    expect(mockPostMessage).toHaveBeenCalledWith("req-1", "buyer-1", "Hello there");
    expect(result.success).toBe(true);
  });

  it("surfaces a rejection error", async () => {
    mockPostMessage.mockRejectedValue(new Error("Request is closed."));
    const result = await postMessageAction("req-1", "Hello there");
    expect(result.formError).toBe("Request is closed.");
  });
});

describe("markRequestSeenAction", () => {
  it("calls through with the signed-in caller", async () => {
    await markRequestSeenAction("req-1");
    expect(mockMarkRequestSeen).toHaveBeenCalledWith("req-1", "buyer-1");
  });
});

describe("getMessagesAction", () => {
  it("returns serialized messages for the signed-in caller", async () => {
    mockGetRequestWithMessages.mockResolvedValue({
      request: {} as never,
      messages: [
        { id: "m1", senderId: "buyer-1", body: "hi", createdAt: new Date("2026-01-01T00:00:00Z") },
      ] as never,
    });
    const result = await getMessagesAction("req-1");
    expect(mockGetRequestWithMessages).toHaveBeenCalledWith("req-1", "buyer-1");
    expect(result).toEqual([
      { id: "m1", senderId: "buyer-1", body: "hi", createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
  });
});

describe("requestReferenceUploadAction", () => {
  it("returns the upload URL and image URL on success", async () => {
    mockRequestReferenceImageUpload.mockResolvedValue({
      uploadUrl: "https://r2.example.com/put",
      imageUrl: "https://media.example.com/ref.png",
      objectKey: "requests/ref.png",
    });
    const result = await requestReferenceUploadAction("ref.png", "image/png", 1024);
    expect(result.uploadUrl).toBe("https://r2.example.com/put");
    expect(result.imageUrl).toBe("https://media.example.com/ref.png");
  });

  it("surfaces a rejection error", async () => {
    mockRequestReferenceImageUpload.mockRejectedValue(new Error("Unsupported file type."));
    const result = await requestReferenceUploadAction("ref.gif", "image/gif", 1024);
    expect(result.error).toBe("Unsupported file type.");
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    mockRequestReferenceImageUpload.mockRejectedValue("nope");
    const result = await requestReferenceUploadAction("ref.png", "image/png", 1024);
    expect(result.error).toBe("Couldn't start upload. Please try again.");
  });
});
