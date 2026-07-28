import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/auth/service", () => ({
  updateDisplayName: vi.fn(),
  changePassword: vi.fn(),
}));

import { auth } from "@/server/auth/config";
import { changePassword, updateDisplayName } from "@/server/auth/service";
import { changePasswordAction, updateDisplayNameAction } from "./actions";

const mockAuth = vi.mocked(auth);
const mockUpdateDisplayName = vi.mocked(updateDisplayName);
const mockChangePassword = vi.mocked(changePassword);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
});

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("updateDisplayNameAction", () => {
  it("calls through with the signed-in user id", async () => {
    const result = await updateDisplayNameAction({}, formData({ displayName: "New Name" }));
    expect(mockUpdateDisplayName).toHaveBeenCalledWith("user-1", "New Name");
    expect(result.success).toBe(true);
  });

  it("surfaces a validation error", async () => {
    mockUpdateDisplayName.mockRejectedValue(new Error("Invalid display name."));
    const result = await updateDisplayNameAction({}, formData({ displayName: "" }));
    expect(result.formError).toBe("Invalid display name.");
  });

  it("requires a signed-in caller", async () => {
    mockAuth.mockResolvedValue(null as never);
    const result = await updateDisplayNameAction({}, formData({ displayName: "x" }));
    expect(result.formError).toBe("Not signed in.");
    expect(mockUpdateDisplayName).not.toHaveBeenCalled();
  });
});

describe("changePasswordAction", () => {
  it("calls through with the signed-in user id", async () => {
    const result = await changePasswordAction(
      {},
      formData({ currentPassword: "old", newPassword: "newpassword123" }),
    );
    expect(mockChangePassword).toHaveBeenCalledWith("user-1", "old", "newpassword123");
    expect(result.success).toBe(true);
  });

  it("surfaces the service's error message", async () => {
    mockChangePassword.mockRejectedValue(new Error("Current password is incorrect."));
    const result = await changePasswordAction(
      {},
      formData({ currentPassword: "wrong", newPassword: "newpassword123" }),
    );
    expect(result.formError).toBe("Current password is incorrect.");
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    mockChangePassword.mockRejectedValue("nope");
    const result = await changePasswordAction(
      {},
      formData({ currentPassword: "wrong", newPassword: "newpassword123" }),
    );
    expect(result.formError).toBe("Something went wrong. Please try again.");
  });
});
