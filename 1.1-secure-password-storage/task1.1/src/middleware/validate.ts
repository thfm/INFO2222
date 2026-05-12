import { z } from 'zod';
import { commonPasswords } from '../crypto/common-passwords.js';

/**
 * Credentials validation.
 *
 * Username: 3–32 chars, [A–Za–z0–9_-]. Strict set prevents quoting tricks
 * from leaking into logs or filenames; case-insensitivity is enforced at
 * the DB layer via COLLATE NOCASE.
 *
 * Password policy (NIST SP 800-63B aligned):
 *   - length >= 12 (NIST floor; NIST lets sites drop complexity rules if
 *     length is enforced)
 *   - length <= 128 (bounds the memory-hard Argon2 work per request —
 *     defense against DoS-by-mega-password)
 *   - not in the common-password blocklist (case-insensitive)
 *
 * No composition rules (upper/lower/digit/symbol) — per NIST SP 800-63B
 * §5.1.1.2, composition rules cause users to pick predictable passwords
 * like "P@ssw0rd" and offer no real entropy.
 */
export const credentialsSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, digits, underscore, or hyphen'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be at most 128 characters')
    .refine(
      (pw) => !commonPasswords.has(pw.toLowerCase()),
      'Password is too common — choose something more unique',
    ),
});

export type Credentials = z.infer<typeof credentialsSchema>;
