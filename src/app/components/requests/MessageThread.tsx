"use client";

import { useEffect, useState } from "react";
import { getMessagesAction, postMessageAction } from "@/app/requests/actions";

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface MessageThreadProps {
  requestId: string;
  initialMessages: Message[];
  currentUserId: string;
  /** Injected for testability — defaults to fetching /api/requests/[id]/messages. */
  fetchMessages?: (requestId: string) => Promise<Message[]>;
  pollIntervalMs?: number;
}

const POLL_INTERVAL_MS = 10_000; // nfr-requirements.md Question 1: B

export default function MessageThread({
  requestId,
  initialMessages,
  currentUserId,
  fetchMessages = getMessagesAction,
  pollIntervalMs = POLL_INTERVAL_MS,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const interval = setInterval(async () => {
      const latest = await fetchMessages(requestId);
      setMessages(latest);
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [requestId, fetchMessages, pollIntervalMs]);

  async function handleSend() {
    const result = await postMessageAction(requestId, body);
    if (result.formError) {
      setError(result.formError);
      return;
    }
    setBody("");
    setError(undefined);
    setMessages(await fetchMessages(requestId));
  }

  return (
    <div data-testid="message-thread">
      <ul className="space-y-2">
        {messages.map((message) => (
          <li
            key={message.id}
            data-testid={`message-thread-item-${message.id}`}
            className={message.senderId === currentUserId ? "text-right" : "text-left"}
          >
            {message.body}
          </li>
        ))}
      </ul>

      {error && <p role="alert">{error}</p>}

      <div className="mt-4 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          data-testid="message-thread-compose-input"
          className="flex-1 rounded border border-gray-300 p-2"
        />
        <button
          type="button"
          onClick={handleSend}
          data-testid="message-thread-send-button"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}
