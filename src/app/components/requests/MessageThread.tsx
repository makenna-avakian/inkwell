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
            className={
              message.senderId === currentUserId
                ? "text-right text-foreground"
                : "text-left text-muted"
            }
          >
            {message.body}
          </li>
        ))}
      </ul>

      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          data-testid="message-thread-compose-input"
          className="flex-1 border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          data-testid="message-thread-send-button"
          className="border border-foreground bg-foreground px-4 py-2 text-xs font-medium tracking-[0.1em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
        >
          Send
        </button>
      </div>
    </div>
  );
}
