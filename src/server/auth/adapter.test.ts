import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/repository", () => ({
  createSession: vi.fn(),
  createUser: vi.fn(),
  deleteSessionByToken: vi.fn(),
  findOAuthAccount: vi.fn(),
  findSessionByToken: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  linkOAuthAccount: vi.fn(),
  updateSessionExpiry: vi.fn(),
  updateUserRow: vi.fn(),
}));

import {
  createSession,
  createUser,
  deleteSessionByToken,
  findOAuthAccount,
  findSessionByToken,
  findUserByEmail,
  findUserById,
  linkOAuthAccount,
  updateSessionExpiry,
  updateUserRow,
} from "@/server/auth/repository";
import { buildAdapter } from "@/server/auth/adapter";

const mockFindUserById = vi.mocked(findUserById);
const mockFindUserByEmail = vi.mocked(findUserByEmail);
const mockCreateUser = vi.mocked(createUser);
const mockCreateSession = vi.mocked(createSession);
const mockFindSessionByToken = vi.mocked(findSessionByToken);
const mockDeleteSessionByToken = vi.mocked(deleteSessionByToken);
const mockFindOAuthAccount = vi.mocked(findOAuthAccount);
const mockLinkOAuthAccount = vi.mocked(linkOAuthAccount);
const mockUpdateUserRow = vi.mocked(updateUserRow);
const mockUpdateSessionExpiry = vi.mocked(updateSessionExpiry);

const USER = {
  id: "user-1",
  email: "a@example.com",
  passwordHash: null,
  displayName: "Alice",
  isAdmin: false,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildAdapter — updateUser/updateSession (required by Auth.js's database session strategy)", () => {
  it("updateUser persists a new name when one is given", async () => {
    mockUpdateUserRow.mockResolvedValue({ ...USER, displayName: "Alicia" });
    const adapter = buildAdapter();

    const result = await adapter.updateUser!({ id: "user-1", name: "Alicia" } as never);

    expect(mockUpdateUserRow).toHaveBeenCalledWith("user-1", { displayName: "Alicia" });
    expect(result.name).toBe("Alicia");
  });

  it("updateUser re-reads the user without writing when no name is given", async () => {
    mockFindUserById.mockResolvedValue(USER);
    const adapter = buildAdapter();

    const result = await adapter.updateUser!({ id: "user-1" } as never);

    expect(mockUpdateUserRow).not.toHaveBeenCalled();
    expect(result.id).toBe("user-1");
  });

  it("updateUser throws without an id", async () => {
    const adapter = buildAdapter();
    await expect(adapter.updateUser!({} as never)).rejects.toThrow();
  });

  it("updateSession persists the new expiry (rolling renewal)", async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    mockUpdateSessionExpiry.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      sessionToken: "tok",
      expiresAt: expires,
      createdAt: new Date(),
    });
    const adapter = buildAdapter();

    const result = await adapter.updateSession!({ sessionToken: "tok", expires } as never);

    expect(mockUpdateSessionExpiry).toHaveBeenCalledWith("tok", expires);
    expect(result?.expires).toBe(expires);
  });

  it("updateSession returns null when the session no longer exists", async () => {
    mockUpdateSessionExpiry.mockResolvedValue(undefined);
    const adapter = buildAdapter();

    const result = await adapter.updateSession!({
      sessionToken: "gone",
      expires: new Date(),
    } as never);

    expect(result).toBeNull();
  });
});

describe("buildAdapter — user lookup/creation", () => {
  it("createUser defaults the display name to the email's local-part when no name is given", async () => {
    mockCreateUser.mockResolvedValue({ ...USER, displayName: "a" });
    const adapter = buildAdapter();

    await adapter.createUser!({ email: "a@example.com" } as never);

    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@example.com", displayName: "a", passwordHash: null }),
    );
  });

  it("createUser trims and uses the given name when provided", async () => {
    mockCreateUser.mockResolvedValue(USER);
    const adapter = buildAdapter();

    await adapter.createUser!({ email: "a@example.com", name: "  Alice  " } as never);

    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "Alice" }),
    );
  });

  it("getUser returns the adapter user shape, or null if not found", async () => {
    const adapter = buildAdapter();
    mockFindUserById.mockResolvedValue(USER);
    expect((await adapter.getUser!("user-1"))?.id).toBe("user-1");

    mockFindUserById.mockResolvedValue(undefined);
    expect(await adapter.getUser!("missing")).toBeNull();
  });

  it("getUserByEmail returns the adapter user shape, or null if not found", async () => {
    const adapter = buildAdapter();
    mockFindUserByEmail.mockResolvedValue(USER);
    expect((await adapter.getUserByEmail!("a@example.com"))?.email).toBe("a@example.com");

    mockFindUserByEmail.mockResolvedValue(undefined);
    expect(await adapter.getUserByEmail!("missing@example.com")).toBeNull();
  });
});

describe("buildAdapter — Google account linking (BR-5)", () => {
  it("getUserByAccount returns null for a non-Google provider", async () => {
    const adapter = buildAdapter();
    const result = await adapter.getUserByAccount!({
      provider: "other",
      providerAccountId: "123",
    } as never);
    expect(result).toBeNull();
    expect(mockFindOAuthAccount).not.toHaveBeenCalled();
  });

  it("getUserByAccount resolves the linked user for Google", async () => {
    mockFindOAuthAccount.mockResolvedValue({
      id: "oauth-1",
      userId: "user-1",
      provider: "google",
      providerAccountId: "google-123",
    });
    mockFindUserById.mockResolvedValue(USER);
    const adapter = buildAdapter();

    const result = await adapter.getUserByAccount!({
      provider: "google",
      providerAccountId: "google-123",
    } as never);

    expect(result?.id).toBe("user-1");
  });

  it("getUserByAccount returns null when no link exists yet", async () => {
    mockFindOAuthAccount.mockResolvedValue(undefined as never);
    const adapter = buildAdapter();

    const result = await adapter.getUserByAccount!({
      provider: "google",
      providerAccountId: "google-999",
    } as never);

    expect(result).toBeNull();
  });

  it("linkAccount rejects a non-Google provider", async () => {
    const adapter = buildAdapter();
    await expect(
      adapter.linkAccount!({ provider: "other", userId: "user-1", providerAccountId: "1" } as never),
    ).rejects.toThrow("Unsupported OAuth provider");
    expect(mockLinkOAuthAccount).not.toHaveBeenCalled();
  });

  it("linkAccount links a Google account", async () => {
    const adapter = buildAdapter();
    await adapter.linkAccount!({
      provider: "google",
      userId: "user-1",
      providerAccountId: "google-123",
    } as never);
    expect(mockLinkOAuthAccount).toHaveBeenCalledWith("user-1", "google", "google-123");
  });
});

describe("buildAdapter — session methods (dead under JWT strategy, still required to exist)", () => {
  it("createSession returns the repository-generated token", async () => {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    mockCreateSession.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      sessionToken: "tok-1",
      expiresAt,
      createdAt: new Date(),
    });
    const adapter = buildAdapter();

    const result = await adapter.createSession!({
      sessionToken: "ignored",
      userId: "user-1",
      expires: new Date(),
    });

    expect(mockCreateSession).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ sessionToken: "tok-1", userId: "user-1", expires: expiresAt });
  });

  it("getSessionAndUser returns null when no session row exists", async () => {
    mockFindSessionByToken.mockResolvedValue(undefined as never);
    const adapter = buildAdapter();
    expect(await adapter.getSessionAndUser!("missing")).toBeNull();
  });

  it("getSessionAndUser deletes and returns null for an expired session (fail closed, BR-9/BR-7)", async () => {
    mockFindSessionByToken.mockResolvedValue({
      session: {
        id: "session-1",
        userId: "user-1",
        sessionToken: "tok-1",
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
      },
      user: USER,
    });
    const adapter = buildAdapter();

    const result = await adapter.getSessionAndUser!("tok-1");

    expect(mockDeleteSessionByToken).toHaveBeenCalledWith("tok-1");
    expect(result).toBeNull();
  });

  it("getSessionAndUser returns the session and user for a valid, unexpired session", async () => {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    mockFindSessionByToken.mockResolvedValue({
      session: { id: "session-1", userId: "user-1", sessionToken: "tok-1", expiresAt, createdAt: new Date() },
      user: USER,
    });
    const adapter = buildAdapter();

    const result = await adapter.getSessionAndUser!("tok-1");

    expect(result?.session.sessionToken).toBe("tok-1");
    expect(result?.user.id).toBe("user-1");
    expect(mockDeleteSessionByToken).not.toHaveBeenCalled();
  });

  it("deleteSession deletes the session by token", async () => {
    const adapter = buildAdapter();
    await adapter.deleteSession!("tok-1");
    expect(mockDeleteSessionByToken).toHaveBeenCalledWith("tok-1");
  });
});
