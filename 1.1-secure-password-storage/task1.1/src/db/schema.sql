-- password_hash holds the full PHC string for Argon2id mode, or a 32-char
-- hex MD5 for md5-weak mode. The algorithm column lets mixed rows coexist
-- during the strong-vs-weak demo.
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash  TEXT    NOT NULL,
  algorithm      TEXT    NOT NULL DEFAULT 'argon2id',
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at  TEXT
);
