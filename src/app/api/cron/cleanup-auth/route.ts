import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredSessions, deleteOldLoginAttempts } from "@/server/auth/repository";

const LOGIN_ATTEMPT_RETENTION_DAYS = 30;

/**
 * Vercel Cron Job target (aidlc-docs/construction/unit-1-auth/infrastructure-design/infrastructure-design.md).
 * Protected by a shared secret — SECURITY-08: not a public/unauthenticated endpoint.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oldAttemptsCutoff = new Date(
    now.getTime() - LOGIN_ATTEMPT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  const [expiredSessions, oldAttempts] = await Promise.all([
    deleteExpiredSessions(now),
    deleteOldLoginAttempts(oldAttemptsCutoff),
  ]);

  return NextResponse.json({
    deletedSessions: expiredSessions,
    deletedLoginAttempts: oldAttempts,
  });
}
