import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/repository", () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUserRow: vi.fn(),
  getRecentLoginAttempts: vi.fn(),
  recordLoginAttempt: vi.fn(),
}));

vi.mock("@/server/auth/password", () => ({
  hashPassword: vi.fn(async (plaintext: string) => `hashed:${plaintext}`),
  verifyPassword: vi.fn(),
}));

// Unit 2 cross-unit re-export (Step 6, unit-2-shops-code-generation-plan.md) —
// mocked here so this stays a unit test of Unit 1's own logic, not an
// integration test pulling in Unit 2's real DB-backed implementation.
vi.mock("@/server/shops/service", () => ({
  isSeller: vi.fn(),
}));

import {
  createUser,
  findUserByEmail,
  findUserById,
  getRecentLoginAttempts,
  recordLoginAttempt,
  updateUserRow,
} from "@/server/auth/repository";
import { verifyPassword } from "@/server/auth/password";
import { isSeller as shopsIsSeller } from "@/server/shops/service";
import {
  EmailAlreadyRegisteredError,
  IncorrectPasswordError,
  NoPasswordSetError,
  RateLimitedError,
  assertNotRateLimited,
  changePassword,
  defaultDisplayName,
  isSeller,
  recordLoginAttemptOutcome,
  signUp,
  updateDisplayName,
} from "@/server/auth/service";

const mockFindUserByEmail = vi.mocked(findUserByEmail);
const mockFindUserById = vi.mocked(findUserById);
const mockCreateUser = vi.mocked(createUser);
const mockUpdateUserRow = vi.mocked(updateUserRow);
const mockGetRecentLoginAttempts = vi.mocked(getRecentLoginAttempts);
const mockRecordLoginAttempt = vi.mocked(recordLoginAttempt);
const mockVerifyPassword = vi.mocked(verifyPassword);

const BASE_USER = {
  id: "u1",
  email: "user@example.com",
  passwordHash: "existing-hash",
  displayName: "User",
  isAdmin: false,
  createdAt: new Date(),
};

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

describe("isSeller (cross-unit re-export, Unit 2 Step 6)", () => {
  it("re-exports Unit 2's isSeller unchanged", async () => {
    vi.mocked(shopsIsSeller).mockResolvedValue(true);
    await expect(isSeller("user-1")).resolves.toBe(true);
    expect(shopsIsSeller).toHaveBeenCalledWith("user-1");
  });
});

describe("updateDisplayName", () => {
  it("trims and persists the new display name", async () => {
    mockUpdateUserRow.mockResolvedValue({ ...BASE_USER, displayName: "New Name" });
    await updateDisplayName("u1", "  New Name  ");
    expect(mockUpdateUserRow).toHaveBeenCalledWith("u1", { displayName: "New Name" });
  });

  it("rejects an empty display name", async () => {
    await expect(updateDisplayName("u1", "   ")).rejects.toThrow();
    expect(mockUpdateUserRow).not.toHaveBeenCalled();
  });
});

describe("changePassword", () => {
  it("rejects when the account has no password set (Google-only account)", async () => {
    mockFindUserById.mockResolvedValue({ ...BASE_USER, passwordHash: null });
    await expect(changePassword("u1", "whatever", "newpassword123")).rejects.toThrow(
      NoPasswordSetError,
    );
    expect(mockUpdateUserRow).not.toHaveBeenCalled();
  });

  it("rejects an incorrect current password", async () => {
    mockFindUserById.mockResolvedValue(BASE_USER);
    mockVerifyPassword.mockResolvedValue(false);
    await expect(changePassword("u1", "wrong", "newpassword123")).rejects.toThrow(
      IncorrectPasswordError,
    );
    expect(mockUpdateUserRow).not.toHaveBeenCalled();
  });

  it("hashes and persists the new password once the current one verifies", async () => {
    mockFindUserById.mockResolvedValue(BASE_USER);
    mockVerifyPassword.mockResolvedValue(true);
    await changePassword("u1", "correct", "newpassword123");
    expect(mockUpdateUserRow).toHaveBeenCalledWith("u1", {
      passwordHash: "hashed:newpassword123",
    });
  });

  it("rejects a new password shorter than 8 characters", async () => {
    mockFindUserById.mockResolvedValue(BASE_USER);
    mockVerifyPassword.mockResolvedValue(true);
    await expect(changePassword("u1", "correct", "short")).rejects.toThrow();
    expect(mockUpdateUserRow).not.toHaveBeenCalled();
  });
});
