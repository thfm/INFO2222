import { describe, it, expect } from 'vitest';
import { credentialsSchema } from './validate.js';

describe('credentialsSchema', () => {
  const ok = { username: 'steven_yu', password: 'CorrectHorse!7' };

  it('accepts a well-formed credential pair', () => {
    expect(credentialsSchema.safeParse(ok).success).toBe(true);
  });

  it('rejects username under 3 chars', () => {
    expect(credentialsSchema.safeParse({ ...ok, username: 'ab' }).success).toBe(false);
  });

  it('rejects username over 32 chars', () => {
    expect(credentialsSchema.safeParse({ ...ok, username: 'a'.repeat(33) }).success).toBe(false);
  });

  it('rejects username with disallowed characters', () => {
    for (const bad of ['has space', 'dot.name', "quote'", '<script>', 'slash/', 'semi;colon']) {
      expect(credentialsSchema.safeParse({ ...ok, username: bad }).success).toBe(false);
    }
  });

  it('rejects password shorter than 12 chars', () => {
    expect(credentialsSchema.safeParse({ ...ok, password: 'short' }).success).toBe(false);
    expect(credentialsSchema.safeParse({ ...ok, password: 'a'.repeat(11) }).success).toBe(false);
  });

  it('rejects password longer than 128 chars (DoS defense against memory-hard hashing)', () => {
    expect(credentialsSchema.safeParse({ ...ok, password: 'a'.repeat(129) }).success).toBe(false);
  });

  it('rejects common passwords (top-100 blocklist)', () => {
    for (const pw of ['password1234', 'qwerty123456']) {
      expect(credentialsSchema.safeParse({ ...ok, password: pw }).success).toBe(false);
    }
  });

  it('common-password check is case-insensitive', () => {
    expect(credentialsSchema.safeParse({ ...ok, password: 'PASSWORD1234' }).success).toBe(false);
  });

  it('accepts exactly 12 chars and exactly 128 chars', () => {
    expect(credentialsSchema.safeParse({ ...ok, password: 'Z'.repeat(12) }).success).toBe(true);
    expect(credentialsSchema.safeParse({ ...ok, password: 'Z'.repeat(128) }).success).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(credentialsSchema.safeParse({ username: 'x' }).success).toBe(false);
    expect(credentialsSchema.safeParse({ password: 'x'.repeat(12) }).success).toBe(false);
    expect(credentialsSchema.safeParse({}).success).toBe(false);
  });
});
