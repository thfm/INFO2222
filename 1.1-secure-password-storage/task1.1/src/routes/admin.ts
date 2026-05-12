import { Router, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';
import { listUsers } from '../db/users.js';

/**
 * Demo-only endpoint. Exposes stored password hashes for recording the
 * Task 1.1 and Task 2 videos so graders can see Argon2id PHC strings /
 * MD5 hashes on-screen. Never mount in a production configuration.
 */
export function adminRoutes(db: Database.Database): Router {
  const r = Router();
  r.get('/users', (_req: Request, res: Response) => {
    res.json({
      warning:
        'DEMO-ONLY endpoint. Exposes password hashes for recording the Task 1.1 and Task 2 videos. Never deploy this to production.',
      users: listUsers(db),
    });
  });
  return r;
}
