import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  loginAttempts,
  oauthAccounts,
  sessions,
  users,
  type NewUser,
  type Session,
  type User,
} from "@/server/db/schema";
import { randomUUID } from "crypto";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function createUser(input: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(input).returning();
  return user;
}

export async function findOAuthAccount(
  provider: "google",
  providerAccountId: string,
) {
  const [account] = await db
    .select()
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, providerAccountId),
      ),
    )
    .limit(1);
  return account;
}

export async function linkOAuthAccount(
  userId: string,
  provider: "google",
  providerAccountId: string,
) {
  const [account] = await db
    .insert(oauthAccounts)
    .values({ userId, provider, providerAccountId })
    .returning();
  return account;
}

export async function updateUserRow(
  id: string,
  patch: Partial<Pick<NewUser, "displayName" | "passwordHash">>,
): Promise<User | undefined> {
  const [user] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
  return user;
}

export async function createSession(userId: string) {
  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      sessionToken: randomUUID(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    })
    .returning();
  return session;
}

export async function findSessionByToken(sessionToken: string) {
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.sessionToken, sessionToken))
    .limit(1);
  return row;
}

export async function updateSessionExpiry(
  sessionToken: string,
  expiresAt: Date,
): Promise<Session | undefined> {
  const [session] = await db
    .update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.sessionToken, sessionToken))
    .returning();
  return session;
}

export async function deleteSessionByToken(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export async function deleteExpiredSessions(now: Date = new Date()): Promise<number> {
  const deleted = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.id });
  return deleted.length;
}

export async function deleteOldLoginAttempts(
  olderThan: Date,
): Promise<number> {
  const deleted = await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.attemptedAt, olderThan))
    .returning({ id: loginAttempts.id });
  return deleted.length;
}

export async function recordLoginAttempt(
  email: string,
  succeeded: boolean,
): Promise<void> {
  await db.insert(loginAttempts).values({ email, succeeded });
}

/** Newest-first, per rate-limit.ts's expected input ordering. */
export async function getRecentLoginAttempts(email: string, limit = 50) {
  return db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email))
    .orderBy(desc(loginAttempts.attemptedAt))
    .limit(limit);
}
