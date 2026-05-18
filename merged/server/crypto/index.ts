/**
 * Runtime switch between strong (Argon2id) and weak (MD5) hashing
 * implementations based on the WEAK_MODE env flag, chosen once at boot.
 *
 * Both modules export the same function surface, so route handlers don't
 * branch on mode. Lets the same binary serve Task 1.1 (strong) and Task 2
 * vulnerability (weak) demos.
 */
const weakMode = process.env.WEAK_MODE === '1';
const impl = weakMode
  ? await import('./weak.js')
  : await import('./password.js');

export const hashPassword = impl.hashPassword;
export const verifyPassword = impl.verifyPassword;
export const wasteTimeLikeAVerify = impl.wasteTimeLikeAVerify;
export const ALGORITHM: string = impl.ALGORITHM;
