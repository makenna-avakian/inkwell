import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { buildAdapter } from "@/server/auth/adapter";
import { verifyPassword } from "@/server/auth/password";
import { findUserByEmail } from "@/server/auth/repository";
import {
  assertNotRateLimited,
  RateLimitedError,
  recordLoginAttemptOutcome,
} from "@/server/auth/service";

/** BR-9: fail closed — any error here must result in `null` (unauthenticated),
 *  never a thrown error that could be misread as "trust this request." */
async function authorizeCredentials(
  credentials: Partial<Record<"email" | "password", unknown>>,
) {
  const email = typeof credentials.email === "string" ? credentials.email : "";
  const password =
    typeof credentials.password === "string" ? credentials.password : "";

  if (!email || !password) return null;

  // Let RateLimitedError propagate — the sign-in Server Action / form
  // surfaces retryAfterSeconds to the user (frontend-components.md).
  await assertNotRateLimited(email);

  const user = await findUserByEmail(email);
  // A user created via Google-only sign-in has no passwordHash — password
  // sign-in must fail for them exactly like an unknown email (enumeration
  // prevention, business-logic-model.md's Sign-In workflow).
  const passwordValid =
    !!user?.passwordHash && (await verifyPassword(password, user.passwordHash));

  await recordLoginAttemptOutcome(email, passwordValid);

  if (!passwordValid || !user) return null;

  return { id: user.id, email: user.email, name: user.displayName };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Adapter is still required for Google OAuth's user/account persistence
  // even under the JWT session strategy — only its session-related methods
  // (createSession/getSessionAndUser/updateSession/deleteSession) go unused.
  adapter: buildAdapter(),
  // JWT, not database (superseding Question 2: A) — Auth.js does not support
  // database-strategy sessions together with the Credentials provider: a
  // credentials sign-in silently falls back to a JWT cookie regardless of
  // this setting, leaving the `session` callback's `user` param undefined
  // and the session unreadable. Confirmed via direct curl against
  // /api/auth/callback/credentials — the cookie set was already a JWE, and
  // /api/auth/session returned null despite it being sent back correctly.
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          return await authorizeCredentials(credentials);
        } catch (error) {
          if (error instanceof RateLimitedError) throw error;
          // Fail closed on any unexpected error (SECURITY-15 / BR-9).
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    // JWT strategy: `user` is only present on the initial sign-in call, so
    // it must be copied onto the token to survive subsequent requests.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
