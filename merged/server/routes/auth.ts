import { Router, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';
import {
  ALGORITHM,
  hashPassword,
  verifyPassword,
  wasteTimeLikeAVerify,
} from '../crypto/index.js';
import {
  createUser,
  findByUsername,
  touchLogin,
  updateHash,
} from '../db/users.js';
import { credentialsSchema } from '../middleware/validate.js';

export function authRoutes(db: Database.Database): Router {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const { username, password } = parsed.data;
    if (findByUsername(db, username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hash = await hashPassword(password);
    const user = createUser(db, username, hash, ALGORITHM);
    return res.status(201).json({ id: user.id, username: user.username, algorithm: ALGORITHM });
  });

  router.post('/login', async (req: Request, res: Response) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      await wasteTimeLikeAVerify();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { username, password } = parsed.data;
    const user = findByUsername(db, username);
    if (!user) {
      await wasteTimeLikeAVerify();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { ok, needsRehash } = await verifyPassword(user.password_hash, password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (needsRehash) {
      const fresh = await hashPassword(password);
      updateHash(db, user.id, fresh, ALGORITHM);
    } else {
      touchLogin(db, user.id);
    }

    return res.status(200).json({ id: user.id, username: user.username, algorithm: user.algorithm });
  });

  return router;
}
