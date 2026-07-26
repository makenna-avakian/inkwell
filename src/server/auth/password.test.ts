import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing (example-based)", () => {
  it("verifies a correct password against its own hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(
      verifyPassword("correct horse battery staple", hash),
    ).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time (salted)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-input"),
      hashPassword("same-input"),
    ]);
    expect(a).not.toEqual(b);
  });
});

describe("password hashing (PBT-01/PBT-02: round-trip property)", () => {
  // bcrypt is deliberately slow (SECURITY-12 adaptive hashing) — keep numRuns
  // modest and give these tests a longer timeout than the 5s Vitest default.
  it(
    "verifyPassword(p, hashPassword(p)) is always true for any valid password",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 8, maxLength: 72 }), async (pw) => {
          const hash = await hashPassword(pw);
          expect(await verifyPassword(pw, hash)).toBe(true);
        }),
        { numRuns: 10 },
      );
    },
    20_000,
  );

  it(
    "verifyPassword(p1, hashPassword(p2)) is always false for p1 !== p2",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 40 }),
          fc.string({ minLength: 8, maxLength: 40 }),
          async (p1, p2) => {
            fc.pre(p1 !== p2);
            const hash = await hashPassword(p2);
            expect(await verifyPassword(p1, hash)).toBe(false);
          },
        ),
        { numRuns: 8 },
      );
    },
    20_000,
  );
});
