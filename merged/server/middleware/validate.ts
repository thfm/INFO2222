import { z } from 'zod';
import { commonPasswords } from '../crypto/common-passwords.js';

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
      (password) => !commonPasswords.has(password.toLowerCase()),
      'Password is too common - choose something more unique',
    ),
});

export type Credentials = z.infer<typeof credentialsSchema>;
