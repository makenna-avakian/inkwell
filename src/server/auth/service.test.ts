import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/repository", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  getRecentLoginAttempts: vi.fn(),
  recordLoginAttempt: vi.fn(),
}));

import {
  createUser,
  findUserByEmail,
  getRecentLoginAttempts,
  recordLoginAttempt,
} from "@/server/auth/repository";
import {
  EmailAlreadyRegisteredError,
  RateLimitedError,
  assertNotRateLimited,
  defaultDisplayName,
  recordLoginAttemptOutcome,
  signUp,
} from "@/server/auth/service";

const mockFindUserByEmail = vi.mocked(findUserByEmail);
const mockCreateUser = vi.mocked(createUser);
const mockGetRecentLoginAttempts = vi.mocked(getRecentLoginAttempts);
const mockRecordLoginAttempt = vi.mocked(recordLoginAttempt);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("defaultDisplayName (BR-4)", () => {
  it("uses the local-part of the email", () => {
    expect(defaultDisplayName("jane.doe@example.com")).toBe("jane.doe");
  });
});

describe("signUp", () => {
  it("creates a user with a default display name when none is supplied", async () => {
    mockFindUserByEmail.mockResolvedValue(undefined);
    mockCreateUser.mockResolvedValue({
      id: "u1",
      email: "new@example.com",
      passwordHash: "hashed",
      displayName: "new",
      isAdmin: false,
      createdAt: new Date(),
    });

    await signUp({ email: "new@example.com", password: "password123" });

    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@example.com", displayName: "new" }),
    );
  });

  it("rejects sign-up for an email that already has an account", async () => {
    mockFindUserByEmail.mockResolvedValue({
      id: "u1",
      email: "taken@example.com",
      passwordHash: "hashed",
      displayName: "taken",
      isAdmin: false,
      createdAt: new Date(),
    });

    await expect(
      signUp({ email: "taken@example.com", password: "password123" }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters (BR-2)", async () => {
    await expect(
      signUp({ email: "short@example.com", password: "short" }),
    ).rejects.toThrow();
  });
});

describe("assertNotRateLimited (BR-6)", () => {
  it("does not throw when there is no delay required", async () => {
    mockGetRecentLoginAttempts.mockResolvedValue([]);
    await expect(assertNotRateLimited("a@example.com")).resolves.toBeUndefined();
  });

  it("throws RateLimitedError with the correct retryAfterSeconds once past the free-attempt threshold", async () => {
    const now = new Date();
    mockGetRecentLoginAttempts.mockResolvedValue(
      Array.from({ length: 5 }, () => ({
        id: "x",
        email: "a@example.com",
        succeeded: false,
        attemptedAt: now,
      })),
    );
    await expect(assertNotRateLimited("a@example.com")).rejects.toThrow(
      RateLimitedError,
    );
  });
});

describe("recordLoginAttemptOutcome", () => {
  it("records the outcome regardless of whether the email exists (enumeration prevention)", async () => {
    await recordLoginAttemptOutcome("unknown@example.com", false);
    expect(mockRecordLoginAttempt).toHaveBeenCalledWith(
      "unknown@example.com",
      false,
    );
  });
});
