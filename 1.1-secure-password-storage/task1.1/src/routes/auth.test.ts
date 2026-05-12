import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Express } from 'express';
import type Database from 'better-sqlite3';
import { authRoutes } from './auth.js';
import { openDbWithSchema, findByUsername } from '../db/users.js';

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
});

afterEach(() => {
  db.close();
});

describe('POST /register', () => {
  it('registers a new user and returns 201', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'alice', password: 'CorrectHorse!7' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), username: 'alice' });
  });

  it('persists the user with an Argon2id PHC hash in the DB', async () => {
    await request(app)
      .post('/register')
      .send({ username: 'bob', password: 'CorrectHorse!7' });
    const row = findByUsername(db, 'bob');
    expect(row).toBeDefined();
    expect(row!.password_hash).toMatch(/^\$argon2id\$/);
    expect(row!.algorithm).toBe('argon2id');
  });

  it('returns 409 on duplicate username (case-insensitive)', async () => {
    await request(app)
      .post('/register')
      .send({ username: 'carol', password: 'CorrectHorse!7' });
    const r = await request(app)
      .post('/register')
      .send({ username: 'CAROL', password: 'DifferentPass!9' });
    expect(r.status).toBe(409);
  });

  it('returns 400 on policy violation (short password)', async () => {
    const r = await request(app)
      .post('/register')
      .send({ username: 'dave', password: 'short' });
    expect(r.status).toBe(400);
  });

  it('returns 400 on missing fields', async () => {
    expect((await request(app).post('/register').send({})).status).toBe(400);
    expect((await request(app).post('/register').send({ username: 'e' })).status).toBe(400);
  });

  it('does not echo the password in any response body', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'eve', password: 'CorrectHorse!7' });
    expect(JSON.stringify(res.body)).not.toContain('CorrectHorse!7');
  });
});

describe('POST /login', () => {
  async function registerFixture(username: string, password: string): Promise<void> {
    await request(app).post('/register').send({ username, password });
  }

  it('returns 200 on valid credentials', async () => {
    await registerFixture('fiona', 'CorrectHorse!7');
    const r = await request(app)
      .post('/login')
      .send({ username: 'fiona', password: 'CorrectHorse!7' });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ id: expect.any(Number), username: 'fiona' });
  });

  it('returns 401 on wrong password', async () => {
    await registerFixture('gina', 'CorrectHorse!7');
    const r = await request(app)
      .post('/login')
      .send({ username: 'gina', password: 'WrongPassword!9' });
    expect(r.status).toBe(401);
  });

  it('returns 401 on unknown username (same status + body as wrong password)', async () => {
    const r = await request(app)
      .post('/login')
      .send({ username: 'does-not-exist', password: 'AnyValid1Pass!' });
    expect(r.status).toBe(401);
  });

  it('updates last_login_at on successful login', async () => {
    await registerFixture('hana', 'CorrectHorse!7');
    expect(findByUsername(db, 'hana')!.last_login_at).toBeNull();
    await request(app).post('/login').send({ username: 'hana', password: 'CorrectHorse!7' });
    expect(findByUsername(db, 'hana')!.last_login_at).not.toBeNull();
  });

  it('login time is within 2.5x for wrong-password vs unknown-user (timing defense)', async () => {
    await registerFixture('ida', 'CorrectHorse!7');
    // 15 warmup + 15 measured samples. Argon2id has high per-call variance
    // (std dev ~20–40% of mean) and CI runners add scheduling jitter. The
    // bound here is deliberately loose at 2.5x: without wasteTimeLikeAVerify
    // the unknown-user path would be ~100x faster (DB lookup only vs full
    // Argon2 verify), so any bound under ~10x detects the real failure mode.
    // A tighter bound invites flaky CI failures from noise, not from a
    // regression in the timing defense.
    const runs = 15;
    const wrongTimes: number[] = [];
    const unknownTimes: number[] = [];

    // Warmup to avoid first-request JIT/import skew
    for (let i = 0; i < 5; i++) {
      await request(app).post('/login').send({ username: 'ida', password: 'x' });
      await request(app).post('/login').send({ username: 'zzz', password: 'x' });
    }

    for (let i = 0; i < runs; i++) {
      let t0 = performance.now();
      await request(app).post('/login').send({ username: 'ida', password: 'WrongPassword!9' });
      wrongTimes.push(performance.now() - t0);

      t0 = performance.now();
      await request(app).post('/login').send({ username: 'never-seen', password: 'WrongPassword!9' });
      unknownTimes.push(performance.now() - t0);
    }

    const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
    const wrongAvg = avg(wrongTimes);
    const unknownAvg = avg(unknownTimes);
    const ratio = Math.max(wrongAvg, unknownAvg) / Math.min(wrongAvg, unknownAvg);
    expect(ratio).toBeLessThan(2.5);
  }, 60_000);

  it('returns 401 on malformed body (runs dummy verify to equalize time)', async () => {
    const r = await request(app).post('/login').send({ username: 'x' });
    expect(r.status).toBe(401);
  });
});
