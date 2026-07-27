import type { Adapter, AdapterUser } from "next-auth/adapters";
import {
  createSession as dbCreateSession,
  createUser as dbCreateUser,
  deleteSessionByToken,
  findOAuthAccount,
  findSessionByToken,
  findUserByEmail,
  findUserById,
  linkOAuthAccount,
  updateSessionExpiry,
  updateUserRow,
} from "@/server/auth/repository";
import { defaultDisplayName } from "@/server/auth/service";
import type { User } from "@/server/db/schema";

function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    // Email is always verified here: password accounts are created directly
    // by our own signUp flow (no email verification step in Phase 1), and
    // OAuth accounts are only auto-linked when Google has verified the email
    // (BR-5) — see functional-design/business-logic-model.md.
    emailVerified: null,
    name: user.displayName,
  };
}

/**
 * Hand-rolled Adapter (rather than @auth/drizzle-adapter) because our schema
 * is intentionally minimal relative to Auth.js's default Account model (no
 * stored OAuth tokens — we only need identity linking, per Functional
 * Design). Implements only what Phase 1 uses: user lookup/creation, Google
 * account linking (BR-5), and database sessions (Question 2: A).
 */
export function buildAdapter(): Adapter {
  return {
    async createUser(data) {
      const user = await dbCreateUser({
        email: data.email!,
        displayName: data.name?.trim() || defaultDisplayName(data.email!),
        passwordHash: null,
      });
      return toAdapterUser(user);
    },

    async getUser(id) {
      const user = await findUserById(id);
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const user = await findUserByEmail(email);
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      if (provider !== "google") return null;
      const account = await findOAuthAccount("google", providerAccountId);
      if (!account) return null;
      const user = await findUserById(account.userId);
      return user ? toAdapterUser(user) : null;
    },

    async linkAccount(account) {
      if (account.provider !== "google") {
        throw new Error(`Unsupported OAuth provider: ${account.provider}`);
      }
      await linkOAuthAccount(
        account.userId,
        "google",
        account.providerAccountId,
      );
    },

    async createSession({ userId }) {
      // We generate our own session token (repository.createSession) rather
      // than trusting the one Auth.js proposes, keeping token generation in
      // one place (BR-7).
      const session = await dbCreateSession(userId);
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expiresAt,
      };
    },

    async getSessionAndUser(sessionToken) {
      const row = await findSessionByToken(sessionToken);
      if (!row) return null;
      // BR-9/BR-7: fail closed on expiry, don't rely on a later query to catch it.
      if (row.session.expiresAt.getTime() < Date.now()) {
        await deleteSessionByToken(sessionToken);
        return null;
      }
      return {
        session: {
          sessionToken: row.session.sessionToken,
          userId: row.session.userId,
          expires: row.session.expiresAt,
        },
        user: toAdapterUser(row.user),
      };
    },

    async deleteSession(sessionToken) {
      await deleteSessionByToken(sessionToken);
    },

    // Required by Auth.js's database-session strategy even though no Phase 1
    // flow calls these directly: getSessionAndUser triggers an updateSession
    // call on every request past sessionMaxAge/updateAge (rolling renewal),
    // and assertConfig() throws MissingAdapterMethods at startup if either is
    // absent regardless of whether our own code ever invokes them.
    async updateUser(data) {
      if (!data.id) throw new Error("updateUser requires an id");
      const user = data.name
        ? await updateUserRow(data.id, { displayName: data.name })
        : await findUserById(data.id);
      if (!user) throw new Error("User not found");
      return toAdapterUser(user);
    },

    async updateSession({ sessionToken, expires }) {
      if (!expires) return null;
      const session = await updateSessionExpiry(sessionToken, expires);
      if (!session) return null;
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expiresAt,
      };
    },

    // unlinkAccount is unused by Phase 1's flows (no account-unlinking UI) —
    // intentionally omitted rather than stubbed; Auth.js only requires it
    // when an adapter supports account unlinking to begin with.
  };
}
