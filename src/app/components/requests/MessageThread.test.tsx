import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/requests/actions", () => ({
  postMessageAction: vi.fn(),
  getMessagesAction: vi.fn(),
}));

import { getMessagesAction, postMessageAction } from "@/app/requests/actions";
import MessageThread from "./MessageThread";

const mockPostMessage = vi.mocked(postMessageAction);
const mockGetMessages = vi.mocked(getMessagesAction);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MessageThread", () => {
  it("sends a message and refreshes the list", async () => {
    mockPostMessage.mockResolvedValue({ success: true });
    mockGetMessages.mockResolvedValue([
      { id: "m1", senderId: "buyer-1", body: "Hi", createdAt: new Date().toISOString() },
      { id: "m2", senderId: "seller-1", body: "Hello!", createdAt: new Date().toISOString() },
    ]);

    const user = userEvent.setup();
    render(
      <MessageThread requestId="req-1" currentUserId="buyer-1" initialMessages={[]} />,
    );

    await user.type(screen.getByTestId("message-thread-compose-input"), "Hi");
    await user.click(screen.getByTestId("message-thread-send-button"));

    await waitFor(() => {
      expect(screen.getByTestId("message-thread-item-m2")).toBeInTheDocument();
    });
    expect(mockPostMessage).toHaveBeenCalledWith("req-1", "Hi");
  });

  it("polls for new messages on the configured interval", async () => {
    vi.useFakeTimers();
    mockGetMessages.mockResolvedValue([
      { id: "m3", senderId: "seller-1", body: "New message", createdAt: new Date().toISOString() },
    ]);

    render(
      <MessageThread
        requestId="req-1"
        currentUserId="buyer-1"
        initialMessages={[]}
        pollIntervalMs={1000}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(mockGetMessages).toHaveBeenCalledWith("req-1");
  });
});
