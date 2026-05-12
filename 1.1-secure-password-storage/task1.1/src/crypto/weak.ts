import { createHash } from 'node:crypto';

/**
 * INTENTIONALLY WEAK hashing for Task 2 vulnerability demonstration.
 * MD5 with no salt, no pepper, no iterations, no memory cost.
 *
 * DO NOT USE OUTSIDE THE TASK 2 VIDEO SEGMENT. Selected at boot via the
 * WEAK_MODE=1 env flag; the production path is ./password.ts.
 */
export const ALGORITHM = 'md5-weak' as const;

export async function hashPassword(password: string): Promise<string> {
  return createHash('md5').update(password, 'utf8').digest('hex');
}

export async function verifyPassword(
  storedHash: string,
  password: string,
): Promise<{ ok: boolean; needsRehash: boolean }> {
  // Guard: this verifier only accepts 32-char hex MD5 digests. If the stored
  // hash is an Argon2 PHC string from a prior strong-mode session, fail closed.
  // Cross-mode login is intentionally not supported.
  if (!/^[0-9a-f]{32}$/.test(storedHash)) {
    return { ok: false, needsRehash: false };
  }
  const computed = createHash('md5').update(password, 'utf8').digest('hex');
  return { ok: computed === storedHash, needsRehash: false };
}

export async function wasteTimeLikeAVerify(): Promise<void> {
  // No-op: timing attacks are the least of weak-mode's problems.
}
