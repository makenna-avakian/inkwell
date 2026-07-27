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
  findUserById,
  updateSessionExpiry,
  updateUserRow,
} from "@/server/auth/repository";
import { buildAdapter } from "@/server/auth/adapter";

const mockFindUserById = vi.mocked(findUserById);
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
