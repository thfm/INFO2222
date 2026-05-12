import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pepper } from './pepper.js';

const ORIGINAL_PEPPER = process.env.PEPPER;

beforeEach(() => {
  process.env.PEPPER = 'test-pepper-minimum-16-chars-long!';
});

afterEach(() => {
  if (ORIGINAL_PEPPER === undefined) delete process.env.PEPPER;
  else process.env.PEPPER = ORIGINAL_PEPPER;
});

describe('pepper', () => {
  it('produces a 32-byte Buffer (HMAC-SHA256 output)', () => {
    const out = pepper('any-password');
    expect(out).toBeInstanceOf(Buffer);
    expect(out.length).toBe(32);
  });

  it('is deterministic for the same password and same key', () => {
    expect(pepper('abc').equals(pepper('abc'))).toBe(true);
  });

  it('differs for different passwords', () => {
    expect(pepper('abc').equals(pepper('abd'))).toBe(false);
  });

  it('treats Unicode-equivalent forms as equal via NFC normalization', () => {
    // "café" composed (U+00E9) vs "cafe\u0301" decomposed (e + combining acute)
    const composed = 'caf\u00e9';
    const decomposed = 'cafe\u0301';
    expect(composed).not.toBe(decomposed);
    expect(pepper(composed).equals(pepper(decomposed))).toBe(true);
  });

  it('throws when PEPPER env var is missing', () => {
    delete process.env.PEPPER;
    expect(() => pepper('abc')).toThrow(/PEPPER/);
  });

  it('throws when PEPPER env var is shorter than 16 chars', () => {
    process.env.PEPPER = 'short';
    expect(() => pepper('abc')).toThrow(/16 characters/);
  });
});
