import { describe, it, expect, beforeAll } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  wasteTimeLikeAVerify,
  OWASP_2024_PARAMS,
  ALGORITHM,
} from './password.js';

beforeAll(() => {
  process.env.PEPPER = 'test-pepper-minimum-16-chars-long!';
});

function extractSalt(phc: string): Buffer {
  const parts = phc.split('$');
  return Buffer.from(parts[4], 'base64');
}

describe('hashPassword / verifyPassword', () => {
  it('ALGORITHM tag is argon2id', () => {
    expect(ALGORITHM).toBe('argon2id');
  });

  it('produces PHC strings matching the strict OWASP-2024 param shape', async () => {
    const h = await hashPassword('correct horse battery staple');
    expect(h).toMatch(
      /^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/=]{22,24}\$[A-Za-z0-9+/=]{43,44}$/,
    );
  });

  it('produces different hashes on every call for the same password (salt is random)', async () => {
    const a = await hashPassword('same-password-xyz!');
    const b = await hashPassword('same-password-xyz!');
    expect(a).not.toBe(b);
  });

  it('salt is 16 bytes', async () => {
    const h = await hashPassword('x');
    expect(extractSalt(h).length).toBe(16);
  });

  it('salt is unique across 50 calls (no collisions)', async () => {
    const hashes = await Promise.all(
      Array.from({ length: 50 }, () => hashPassword('same-password')),
    );
    const salts = hashes.map((h) => extractSalt(h).toString('base64'));
    expect(new Set(salts).size).toBe(50);
  }, 30_000);

  it('verifyPassword accepts the correct password', async () => {
    const h = await hashPassword('correct-password!');
    const result = await verifyPassword(h, 'correct-password!');
    expect(result.ok).toBe(true);
    expect(result.needsRehash).toBe(false);
  });

  it('verifyPassword rejects wrong passwords', async () => {
    const h = await hashPassword('correct-password!');
    for (const wrong of ['correct-password', 'Correct-Password!', '', 'correct-password!!']) {
      const result = await verifyPassword(h, wrong);
      expect(result.ok).toBe(false);
    }
  });

  it('verifyPassword returns ok=false for a malformed stored hash without throwing', async () => {
    const result = await verifyPassword('not-a-real-phc-string', 'anything');
    expect(result.ok).toBe(false);
  });

  it('verifyPassword fails closed for a cross-mode MD5 hash (no throw, no ambiguous result)', async () => {
    // An md5-weak row from a prior WEAK_MODE session — 32-char hex MD5.
    const md5Hash = '5f4dcc3b5aa765d61d8327deb882cf99';
    const result = await verifyPassword(md5Hash, 'password');
    expect(result.ok).toBe(false);
    expect(result.needsRehash).toBe(false);
  });

  it('needsRehash returns true when stored hash uses weaker params', async () => {
    const argon2 = (await import('argon2')).default;
    const weakHash = await argon2.hash(
      Buffer.from('ignored-no-pepper-here'),
      { type: argon2.argon2id, memoryCost: 8192, timeCost: 2, parallelism: 1, saltLength: 16 },
    );
    expect(argon2.needsRehash(weakHash, OWASP_2024_PARAMS)).toBe(true);
  });

  it('verifyPassword returns needsRehash=true through the public API when stored hash has weaker params', async () => {
    // Round-trip through our verifyPassword (not argon2 directly) to prove
    // the needsRehash field of the return value is wired correctly.
    const argon2 = (await import('argon2')).default;
    const { pepper } = await import('./pepper.js');
    const password = 'rotate-me-please-1';
    // Hash with same pepper but weaker memoryCost so verify succeeds AND
    // needsRehash fires.
    const weakerStoredPhc = await argon2.hash(pepper(password), {
      type: argon2.argon2id,
      memoryCost: 8192,
      timeCost: 2,
      parallelism: 1,
      saltLength: 16,
    });
    const result = await verifyPassword(weakerStoredPhc, password);
    expect(result.ok).toBe(true);
    expect(result.needsRehash).toBe(true);
  });

  it('wasteTimeLikeAVerify runs without throwing (timing defense)', async () => {
    await expect(wasteTimeLikeAVerify()).resolves.toBeUndefined();
  });

  it('OWASP_2024_PARAMS matches the cheat-sheet first-choice row', () => {
    expect(OWASP_2024_PARAMS.memoryCost).toBe(19456);
    expect(OWASP_2024_PARAMS.timeCost).toBe(2);
    expect(OWASP_2024_PARAMS.parallelism).toBe(1);
    expect(OWASP_2024_PARAMS.hashLength).toBe(32);
    expect(OWASP_2024_PARAMS.saltLength).toBe(16);
  });
});
