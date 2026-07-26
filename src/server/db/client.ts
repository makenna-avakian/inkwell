import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Falls back to a syntactically-valid placeholder connection string when
 * DATABASE_URL isn't set, so that merely *importing* this module (or
 * anything that transitively imports it — e.g. src/server/auth/service.ts
 * re-exporting src/server/shops/service.ts's isSeller) never throws.
 *
 * This matters for unit tests that import business logic without a real
 * database (e.g. src/server/auth/service.test.ts): they never call `db`'s
 * methods (repository calls are mocked via vi.mock), so the placeholder is
 * never actually used to connect anywhere. Tests that DO need a real
 * database (src/server/*\/repository.test.ts) are separately gated with
 * `describe.skipIf(!process.env.DATABASE_URL)` and only run in CI/locally
 * once a real DATABASE_URL is provided.
 */
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
