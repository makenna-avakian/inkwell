import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** BR-3: adaptive hashing (bcrypt), never store or log plaintext. */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/** Round-trip counterpart to hashPassword — see PBT-01 table in business-rules.md. */
export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
