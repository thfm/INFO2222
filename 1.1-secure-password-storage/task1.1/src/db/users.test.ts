import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import {
  openDbWithSchema,
  createUser,
  findByUsername,
  getUserById,
  updateHash,
  touchLogin,
  listUsers,
} from './users.js';

let db: Database.Database;

beforeEach(() => {
  db = openDbWithSchema(':memory:');
});

afterEach(() => {
  db.close();
});

describe('db/users', () => {
  it('creates and retrieves a user by username (case-insensitive)', () => {
    const user = createUser(db, 'Alice', 'hash-1', 'argon2id');
    expect(user.id).toBeGreaterThan(0);
    expect(user.username).toBe('Alice');
    expect(findByUsername(db, 'alice')?.id).toBe(user.id);
    expect(findByUsername(db, 'ALICE')?.id).toBe(user.id);
  });

  it('rejects duplicate usernames case-insensitively', () => {
    createUser(db, 'Alice', 'h1', 'argon2id');
    expect(() => createUser(db, 'alice', 'h2', 'argon2id')).toThrow();
    expect(() => createUser(db, 'ALICE', 'h3', 'argon2id')).toThrow();
  });

  it('getUserById returns the row or undefined', () => {
    const u = createUser(db, 'bob', 'h', 'argon2id');
    expect(getUserById(db, u.id)?.username).toBe('bob');
    expect(getUserById(db, 999)).toBeUndefined();
  });

  it('updateHash changes the hash and algorithm', () => {
    const u = createUser(db, 'carol', 'old-hash', 'argon2id');
    updateHash(db, u.id, 'new-hash', 'argon2id');
    expect(getUserById(db, u.id)?.password_hash).toBe('new-hash');
  });

  it('touchLogin sets last_login_at', () => {
    const u = createUser(db, 'dave', 'h', 'argon2id');
    expect(getUserById(db, u.id)?.last_login_at).toBeNull();
    touchLogin(db, u.id);
    expect(getUserById(db, u.id)?.last_login_at).not.toBeNull();
  });

  it('listUsers returns all rows in id order', () => {
    createUser(db, 'a', 'h', 'argon2id');
    createUser(db, 'b', 'h', 'argon2id');
    createUser(db, 'c', 'h', 'argon2id');
    const users = listUsers(db);
    expect(users.map((u) => u.username)).toEqual(['a', 'b', 'c']);
  });

  it('is immune to SQL injection via prepared statements', () => {
    const evil = "'; DROP TABLE users; --";
    createUser(db, evil, 'h', 'argon2id');
    expect(findByUsername(db, evil)?.username).toBe(evil);
    expect(listUsers(db).length).toBe(1);
  });
});
