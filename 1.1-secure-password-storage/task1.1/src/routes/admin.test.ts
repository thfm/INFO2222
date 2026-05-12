import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Express } from 'express';
import type Database from 'better-sqlite3';
import { adminRoutes } from './admin.js';
import { authRoutes } from './auth.js';
import { openDbWithSchema } from '../db/users.js';

let app: Express;
let db: Database.Database;

beforeAll(() => {
  process.env.PEPPER = 'test-pepper-minimum-16-chars-long!';
});

beforeEach(() => {
  db = openDbWithSchema(':memory:');
  app = express();
  app.use(express.json({ limit: '4kb' }));
  app.use('/', authRoutes(db));
  app.use('/admin', adminRoutes(db));
});

afterEach(() => {
  db.close();
});

describe('GET /admin/users', () => {
  it('returns an empty list with a warning when no users exist', async () => {
    const r = await request(app).get('/admin/users');
    expect(r.status).toBe(200);
    expect(r.body.warning).toMatch(/DEMO-ONLY/);
    expect(r.body.users).toEqual([]);
  });

  it('returns registered users with their PHC hashes for the demo video', async () => {
    await request(app).post('/register').send({ username: 'demo1', password: 'CorrectHorse!7' });
    await request(app).post('/register').send({ username: 'demo2', password: 'DifferentPass!9' });
    const r = await request(app).get('/admin/users');
    expect(r.status).toBe(200);
    expect(r.body.users.length).toBe(2);
    expect(r.body.users[0].password_hash).toMatch(/^\$argon2id\$/);
    expect(r.body.users[0].username).toBe('demo1');
  });
});
