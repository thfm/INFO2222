import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_SQL = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  algorithm: string;
  created_at: string;
  last_login_at: string | null;
};

function applySchema(db: Database.Database, sql: string): void {
  for (const statement of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    db.prepare(statement).run();
  }
}

export function openDbWithSchema(path: string): Database.Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applySchema(db, SCHEMA_SQL);
  return db;
}

export function createUser(
  db: Database.Database,
  username: string,
  passwordHash: string,
  algorithm: string,
): UserRow {
  const info = db
    .prepare('INSERT INTO users (username, password_hash, algorithm) VALUES (?, ?, ?)')
    .run(username, passwordHash, algorithm);
  return getUserById(db, Number(info.lastInsertRowid))!;
}

export function findByUsername(
  db: Database.Database,
  username: string,
): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
}

export function getUserById(
  db: Database.Database,
  id: number,
): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function updateHash(
  db: Database.Database,
  id: number,
  passwordHash: string,
  algorithm: string,
): void {
  db.prepare(
    "UPDATE users SET password_hash = ?, algorithm = ?, last_login_at = datetime('now') WHERE id = ?",
  ).run(passwordHash, algorithm, id);
}

export function touchLogin(db: Database.Database, id: number): void {
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(id);
}

export function listUsers(db: Database.Database): UserRow[] {
  return db.prepare('SELECT * FROM users ORDER BY id').all() as UserRow[];
}
