import argon2 from 'argon2';
import { pepper } from './pepper.js';

export const OWASP_2024_PARAMS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
  saltLength: 16,
} as const;

export const ALGORITHM = 'argon2id' as const;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(pepper(password), OWASP_2024_PARAMS);
}

export async function verifyPassword(
  storedPhc: string,
  password: string,
): Promise<{ ok: boolean; needsRehash: boolean }> {
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

let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = argon2
      .hash(pepper('dummy-will-never-be-a-real-password'), OWASP_2024_PARAMS)
      .catch((error: unknown) => {
        dummyHashPromise = null;
        throw error;
      });
  }
  return dummyHashPromise;
}

export async function wasteTimeLikeAVerify(): Promise<void> {
  const dummy = await getDummyHash();
  await argon2.verify(dummy, pepper('definitely-not-the-right-password'));
}
