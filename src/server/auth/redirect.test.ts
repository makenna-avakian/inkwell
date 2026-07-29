import { describe, expect, it } from "vitest";
import { sanitizeCallbackUrl, signInUrlWithCallback } from "./redirect";

describe("sanitizeCallbackUrl", () => {
  it("accepts a plain relative path", () => {
    expect(sanitizeCallbackUrl("/shop/new")).toBe("/shop/new");
    expect(sanitizeCallbackUrl("/requests/abc-123")).toBe("/requests/abc-123");
  });

  it("falls back to / for a missing value", () => {
    expect(sanitizeCallbackUrl(null)).toBe("/");
    expect(sanitizeCallbackUrl(undefined)).toBe("/");
    expect(sanitizeCallbackUrl("")).toBe("/");
  });

  it("rejects an absolute URL to another host (open-redirect attempt)", () => {
    expect(sanitizeCallbackUrl("https://evil.example.com/phish")).toBe("/");
    expect(sanitizeCallbackUrl("http://evil.example.com")).toBe("/");
  });

  it("rejects a protocol-relative URL (// is browser-interpreted as another host)", () => {
    expect(sanitizeCallbackUrl("//evil.example.com")).toBe("/");
  });

  it("rejects a path that doesn't start with /", () => {
    expect(sanitizeCallbackUrl("evil.example.com")).toBe("/");
  });
});

describe("signInUrlWithCallback", () => {
  it("builds a sign-in URL carrying the sanitized callback as a query param", () => {
    expect(signInUrlWithCallback("/shop/new")).toBe("/sign-in?callbackUrl=%2Fshop%2Fnew");
  });

  it("sanitizes an unsafe callback before embedding it", () => {
    expect(signInUrlWithCallback("https://evil.example.com")).toBe("/sign-in?callbackUrl=%2F");
  });
});
