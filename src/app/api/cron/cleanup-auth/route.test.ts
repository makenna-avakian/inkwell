import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/auth/repository", () => ({
  deleteExpiredSessions: vi.fn(),
  deleteOldLoginAttempts: vi.fn(),
}));

import {
  deleteExpiredSessions,
  deleteOldLoginAttempts,
} from "@/server/auth/repository";
import { GET } from "./route";

const mockDeleteExpiredSessions = vi.mocked(deleteExpiredSessions);
const mockDeleteOldLoginAttempts = vi.mocked(deleteOldLoginAttempts);

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV, CRON_SECRET: "test-secret" };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

function makeRequest(authorization?: string) {
  return new NextRequest("https://example.com/api/cron/cleanup-auth", {
    headers: authorization ? { authorization } : {},
  });
}

describe("GET /api/cron/cleanup-auth", () => {
  it("rejects requests without the correct bearer secret (SECURITY-08)", async () => {
    const response = await GET(makeRequest("Bearer wrong-secret"));
    expect(response.status).toBe(401);
    expect(mockDeleteExpiredSessions).not.toHaveBeenCalled();
  });

  it("rejects requests with no authorization header", async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("runs cleanup and returns counts when authorized", async () => {
    mockDeleteExpiredSessions.mockResolvedValue(3);
    mockDeleteOldLoginAttempts.mockResolvedValue(7);

    const response = await GET(makeRequest("Bearer test-secret"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ deletedSessions: 3, deletedLoginAttempts: 7 });
  });
});
