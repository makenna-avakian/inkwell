import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Integration tests against a real Postgres instance (requirements.md NFR-3:
 * "Integration / API — Vitest + a test database (Docker Postgres)").
 * Skipped unless DATABASE_URL is set — the Build and Test phase wires up the
 * Docker Postgres container and provides it. See
 * aidlc-docs/construction/unit-1-auth/code/repository-layer-summary.md.
 */
describe.skipIf(!process.env.DATABASE_URL)("auth repository (integration)", () => {
  let db: typeof import("@/server/db/client").db;
  let schema: typeof import("@/server/db/schema");
  let repo: typeof import("./repository");

  beforeEach(async () => {
    ({ db } = await import("@/server/db/client"));
    schema = await import("@/server/db/schema");
    repo = await import("./repository");
  });

  afterEach(async () => {
    await db.delete(schema.loginAttempts);
    await db.delete(schema.oauthAccounts);
    await db.delete(schema.sessions);
    await db.delete(schema.users);
  });

  it("creates a user and finds it by email", async () => {
    const created = await repo.createUser({
      email: "int-test@example.com",
      displayName: "int-test",
      passwordHash: "hash",
    });
    const found = await repo.findUserByEmail("int-test@example.com");
    expect(found?.id).toBe(created.id);
  });

  it("creates a session and retrieves it by token, joined with the user", async () => {
    const user = await repo.createUser({
      email: "session-test@example.com",
      displayName: "session-test",
      passwordHash: null,
    });
    const session = await repo.createSession(user.id);

    const found = await repo.findSessionByToken(session.sessionToken);
    expect(found?.user.email).toBe("session-test@example.com");
  });

  it("deleteSessionByToken removes the session (BR-7)", async () => {
    const user = await repo.createUser({
      email: "logout-test@example.com",
      displayName: "logout-test",
      passwordHash: null,
    });
    const session = await repo.createSession(user.id);
    await repo.deleteSessionByToken(session.sessionToken);

    expect(await repo.findSessionByToken(session.sessionToken)).toBeUndefined();
  });

  it("deleteExpiredSessions removes only expired rows", async () => {
    const user = await repo.createUser({
      email: "expiry-test@example.com",
      displayName: "expiry-test",
      passwordHash: null,
    });
    const expiring = await repo.createSession(user.id);
    await db
      .update(schema.sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.sessions.id, expiring.id));

    const live = await repo.createSession(user.id);

    const deletedCount = await repo.deleteExpiredSessions(new Date());
    expect(deletedCount).toBeGreaterThanOrEqual(1);
    expect(await repo.findSessionByToken(expiring.sessionToken)).toBeUndefined();
    expect((await repo.findSessionByToken(live.sessionToken))?.session.id).toBe(
      live.id,
    );
  });

  it("records login attempts newest-first via getRecentLoginAttempts", async () => {
    await repo.recordLoginAttempt("attempts-test@example.com", false);
    await repo.recordLoginAttempt("attempts-test@example.com", false);
    await repo.recordLoginAttempt("attempts-test@example.com", true);

    const attempts = await repo.getRecentLoginAttempts("attempts-test@example.com");
    expect(attempts).toHaveLength(3);
    expect(attempts[0].succeeded).toBe(true); // newest first
  });

  it("deleteOldLoginAttempts removes only attempts older than the cutoff", async () => {
    await repo.recordLoginAttempt("old-attempts@example.com", false);
    const [oldAttempt] = await db
      .select()
      .from(schema.loginAttempts)
      .where(eq(schema.loginAttempts.email, "old-attempts@example.com"));
    await db
      .update(schema.loginAttempts)
      .set({ attemptedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) })
      .where(eq(schema.loginAttempts.id, oldAttempt.id));

    await repo.recordLoginAttempt("old-attempts@example.com", true);

    const deletedCount = await repo.deleteOldLoginAttempts(
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    );
    expect(deletedCount).toBe(1);
    const remaining = await repo.getRecentLoginAttempts("old-attempts@example.com");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].succeeded).toBe(true);
  });

  it("findUserById finds a user by id", async () => {
    const created = await repo.createUser({
      email: "by-id@example.com",
      displayName: "by-id",
      passwordHash: null,
    });
    expect((await repo.findUserById(created.id))?.email).toBe("by-id@example.com");
  });

  it("updateUserRow updates displayName/passwordHash", async () => {
    const created = await repo.createUser({
      email: "update-user@example.com",
      displayName: "Old Name",
      passwordHash: null,
    });
    const updated = await repo.updateUserRow(created.id, { displayName: "New Name" });
    expect(updated?.displayName).toBe("New Name");
  });

  it("updateSessionExpiry updates the session's expiry", async () => {
    const user = await repo.createUser({
      email: "session-update@example.com",
      displayName: "session-update",
      passwordHash: null,
    });
    const session = await repo.createSession(user.id);
    const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60);

    const updated = await repo.updateSessionExpiry(session.sessionToken, newExpiry);

    expect(updated?.expiresAt.getTime()).toBe(newExpiry.getTime());
  });

  it("links and finds a Google OAuth account", async () => {
    const user = await repo.createUser({
      email: "oauth-test@example.com",
      displayName: "oauth-test",
      passwordHash: null,
    });
    await repo.linkOAuthAccount(user.id, "google", "google-account-123");

    const found = await repo.findOAuthAccount("google", "google-account-123");
    expect(found?.userId).toBe(user.id);
    expect(await repo.findOAuthAccount("google", "nonexistent")).toBeUndefined();
  });
});
