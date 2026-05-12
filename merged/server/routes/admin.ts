import { Router, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';
import { listUsers } from '../db/users.js';

export function adminRoutes(db: Database.Database): Router {
  const router = Router();

  router.get('/users', (_req: Request, res: Response) => {
    res.json({
      warning:
        'DEMO-ONLY endpoint. Exposes password hashes so the prototype can demonstrate Argon2id storage. Never deploy this to production.',
      users: listUsers(db),
    });
  });

  return router;
}
