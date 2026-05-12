import argon2 from 'argon2';
import { pepper } from './pepper.js';

/**
 * OWASP Password Storage Cheat Sheet (2024) — Argon2id "first choice" row.
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 *
 * memoryCost: 19 MiB (19456 KiB)
 * timeCost:   2 iterations
 * parallelism: 1 lane
 * saltLength: 16 bytes (128-bit) — NIST SP 800-132 minimum and Argon2 minimum
 * hashLength: 32 bytes (256-bit)
 */
export const OWASP_2024_PARAMS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
  saltLength: 16,
} as const;

export const ALGORITHM = 'argon2id' as const;

/**
 * Hash a plaintext password into a PHC-formatted Argon2id string.
 * Returns: $argon2id$v=19$m=19456,t=2,p=1$<base64 salt>$<base64 hash>
 *
 * The salt is generated internally by libsodium via OS CSPRNG; it is
 * unique per call and embedded in the returned string — no separate
 * salt column needed.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(pepper(password), OWASP_2024_PARAMS);
}

/**
 * Verify a plaintext password against a stored PHC string.
 * Returns { ok, needsRehash }:
 *   ok          — constant-time verification result
 *   needsRehash — true if the stored hash used weaker params than current
 * Never throws on malformed input — returns { ok: false, needsRehash: false }.
 */
export async function verifyPassword(
  storedPhc: string,
  password: string,
): Promise<{ ok: boolean; needsRehash: boolean }> {
  // Guard: this verifier only accepts Argon2id PHC strings. If the stored
  // hash is from a different algorithm (e.g. an md5-weak row from a prior
  // WEAK_MODE session still in the DB), fail closed without throwing.
  // Cross-mode login is intentionally not supported — each mode is a
  // complete snapshot. See README "Weak-mode demo" section.
  if (!storedPhc.startsWith('$argon2id$')) {
    return { ok: false, needsRehash: false };
  }
  try {
    const ok = await argon2.verify(storedPhc, pepper(password));
    const needsRehash = ok && argon2.needsRehash(storedPhc, OWASP_2024_PARAMS);
    return { ok, needsRehash };
  } catch {
    return { ok: false, needsRehash: false };
  }
}

/**
 * Dummy hash used to equalize response time on the unknown-username path
 * in /login. Prevents attackers from timing-distinguishing "user does not
 * exist" from "user exists but wrong password". Lazily initialized.
 */
let _dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (_dummyHashPromise === null) {
    _dummyHashPromise = argon2
      .hash(pepper('dummy-will-never-be-a-real-password'), OWASP_2024_PARAMS)
      .catch((err: unknown) => {
        // Clear the cached rejection so a later call can retry once PEPPER
        // is set. Prevents permanent module poisoning if this path is ever
        // reached before env setup (e.g. in edge test orderings).
        _dummyHashPromise = null;
        throw err;
      });
  }
  return _dummyHashPromise;
}

export async function wasteTimeLikeAVerify(): Promise<void> {
  const dummy = await getDummyHash();
  await argon2.verify(dummy, pepper('definitely-not-the-right-password'));
}
