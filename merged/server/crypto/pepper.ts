import { createHmac } from 'node:crypto';

const DEV_PEPPER =
  'contritrack-local-demo-pepper-change-me-before-production';

function getPepperSecret(): string {
  if (!process.env.PEPPER) {
    process.env.PEPPER = DEV_PEPPER;
    console.warn(
      '[auth] PEPPER is not set. Using the local demo pepper; set PEPPER in production.',
    );
  }
  if (process.env.PEPPER.length < 16) {
    throw new Error('PEPPER env var must be at least 16 characters');
  }
  return process.env.PEPPER;
}

export function pepper(password: string): Buffer {
  return createHmac('sha256', getPepperSecret())
    .update(password.normalize('NFC'), 'utf8')
    .digest();
}
