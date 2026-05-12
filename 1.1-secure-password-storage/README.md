# Task 1.1 — Secure Password Storage (INFO2222 Phase 3)

Node.js + Express + TypeScript auth service demonstrating industry-grade password hashing with **Argon2id**, per-password salt, and a server-side pepper. A `WEAK_MODE=1` env toggle swaps in MD5-no-salt for the Task 2 vulnerability demo.

**Status:** Task 1.1 Password storage

## Prerequisites

- Node.js ≥ 20 (check: `node --version`)
- Build tools for native modules (`argon2`, `better-sqlite3`):
  - **Windows:** Visual Studio Build Tools 2022 with the "Desktop development with C++" workload
  - **macOS:** `xcode-select --install`
  - **Linux:** `apt install build-essential python3`

## Setup

```bash
# 1. From the repo root
cd task1.1-secure-password

# 2. Install dependencies
npm install

# 3. Create your .env from the template and set a real PEPPER
cp .env.example .env
# Edit .env: replace the PEPPER placeholder with 32+ random characters.
# Unix:        head -c 64 /dev/urandom | base64
# PowerShell:  [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000> in a browser. The three panels (Register, Login, Admin) exercise the endpoints.

## Testing

```bash
npm test              # Run once (55 tests across 7 files)
npm run test:watch    # Re-run on file changes
npm run test:coverage # Check ≥80% coverage on src/crypto/**
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/register` | Create user. Body `{username, password}`. → 201 `{id, username}` / 400 / 409. |
| `POST` | `/login` | Verify credentials. Body `{username, password}`. → 200 `{id, username}` / 401. Constant-time on all failure paths. |
| `GET` | `/admin/users` | **DEMO-ONLY.** Dumps stored hashes for video recording. Never deploy this. |
| `GET` | `/` | Minimal HTML test UI. |

## Weak-mode demo (for task 2)

```bash
WEAK_MODE=1 npm run dev
```

Register a user and inspect `/admin/users` — the hash is now a 32-character MD5 with no salt. Feeds directly into `hashcat -m 0 dump.txt rockyou.txt` for the Task 2 vulnerability video.

Switch back to strong mode:

```bash
WEAK_MODE=0 npm run dev   # or just: npm run dev
```

Existing Argon2id rows are **not** converted back to MD5 (or vice versa) — the `algorithm` column tracks which mode each row was hashed with, so strong and weak rows can coexist during the demo.

**Cross-mode login is intentionally unsupported.** If you switch modes while a user's row exists under the old algorithm, that user will receive 401 on login until you re-register them. The verifier in each mode fails closed when it encounters a hash format from the other mode. For a clean video recording, either start fresh (`rm data/app.db`) or keep demo users separate per mode.

## Security decisions

See [`task1.1/docs/TASK-1.1-justification.md`](docs/TASK-1.1-justification.md) for the 5-pt written answer defending the Argon2id choice.


## Source layout

```
src/
├── crypto/            # Pure crypto primitives (Argon2id, MD5, pepper, blocklist)
├── db/                # SQLite schema + users repository (prepared statements)
├── middleware/        # zod credentials validation
├── routes/            # Express route handlers (/register, /login, /admin)
├── server.ts          # Express bootstrap
└── index.html         # Minimal browser test UI
```
