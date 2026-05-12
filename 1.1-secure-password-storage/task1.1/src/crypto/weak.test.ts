import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, wasteTimeLikeAVerify, ALGORITHM } from './weak.js';

describe('weak-mode hashPassword / verifyPassword (MD5, no salt)', () => {
  it('ALGORITHM tag is md5-weak', () => {
    expect(ALGORITHM).toBe('md5-weak');
  });

  it('produces a 32-character hex string (MD5 length)', async () => {
    const h = await hashPassword('password123');
    expect(h).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces the SAME hash for the same password (no salt — that is the vulnerability)', async () => {
    expect(await hashPassword('password123')).toBe(await hashPassword('password123'));
  });

  it('produces known MD5 for "password" for reproducibility of the attack demo', async () => {
    // MD5("password") = 5f4dcc3b5aa765d61d8327deb882cf99
    expect(await hashPassword('password')).toBe('5f4dcc3b5aa765d61d8327deb882cf99');
  });

  it('verifyPassword accepts correct password', async () => {
    const h = await hashPassword('abc');
    const r = await verifyPassword(h, 'abc');
    expect(r.ok).toBe(true);
    expect(r.needsRehash).toBe(false);
  });

  it('verifyPassword rejects wrong password', async () => {
    const h = await hashPassword('abc');
    expect((await verifyPassword(h, 'abd')).ok).toBe(false);
  });

  it('wasteTimeLikeAVerify runs without throwing (no-op in weak mode)', async () => {
    await expect(wasteTimeLikeAVerify()).resolves.toBeUndefined();
  });

  it('verifyPassword fails closed for a cross-mode Argon2id PHC string', async () => {
    // An argon2id row from a prior strong-mode session.
    const phc = '$argon2id$v=19$m=19456,t=2,p=1$c29tZVNhbHQxMjNhYg$somehashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const result = await verifyPassword(phc, 'password');
    expect(result.ok).toBe(false);
  });
});
