import { createHmac } from 'node:crypto';

/**
 * HMAC-SHA256 the password with the server-side pepper secret loaded from
 * process.env.PEPPER. Unicode-normalizes (NFC) the password first so that
 * composed and decomposed equivalents (e.g. "café" in two forms) hash the same.
 *
 * Pepper is defense-in-depth: if the DB is dumped but the env secret is
 * not, attackers cannot begin offline cracking without also compromising
 * the server environment.
 */
export function pepper(password: string): Buffer {
  const key = process.env.PEPPER;
  if (!key) throw new Error('PEPPER env var must be set');
  if (key.length < 16) throw new Error('PEPPER env var must be at least 16 characters');
  return createHmac('sha256', key)
    .update(password.normalize('NFC'), 'utf8')
    .digest();
}
