import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/service", () => ({
  signUp: vi.fn(),
  EmailAlreadyRegisteredError: class EmailAlreadyRegisteredError extends Error {
    constructor() {
      super("An account with this email already exists.");
    }
  },
}));
vi.mock("@/server/auth/config", () => ({
  signIn: vi.fn(),
}));

import { signIn } from "@/server/auth/config";
import { EmailAlreadyRegisteredError, signUp } from "@/server/auth/service";
import { signUpAction } from "./actions";

const mockSignUp = vi.mocked(signUp);
const mockSignIn = vi.mocked(signIn);

beforeEach(() => {
  vi.clearAllMocks();
});

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("signUpAction", () => {
  it("signs up and auto-signs-in on success", async () => {
    mockSignUp.mockResolvedValue({
      id: "u1",
      email: "a@example.com",
      passwordHash: "x",
      displayName: "a",
      isAdmin: false,
      createdAt: new Date(),
    });

    const result = await signUpAction(
      { fieldErrors: {} },
      formData({ email: "a@example.com", password: "password123" }),
    );

    expect(result.fieldErrors).toEqual({});
    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ email: "a@example.com" }),
    );
  });

  it("returns a field error when the email is already registered", async () => {
    mockSignUp.mockRejectedValue(new EmailAlreadyRegisteredError());

    const result = await signUpAction(
      { fieldErrors: {} },
      formData({ email: "taken@example.com", password: "password123" }),
    );

    expect(result.fieldErrors.email).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("returns a generic form error on an unexpected failure (no internal details leaked)", async () => {
    mockSignUp.mockRejectedValue(new Error("db connection refused at 10.0.0.5:5432"));

    const result = await signUpAction(
      { fieldErrors: {} },
      formData({ email: "a@example.com", password: "password123" }),
    );

    expect(result.formError).toBe("Something went wrong. Please try again.");
    expect(result.formError).not.toContain("10.0.0.5");
  });
});
