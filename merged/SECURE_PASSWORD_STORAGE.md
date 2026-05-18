# Secure Password Storage Integration

The merged ContriTrack prototype now includes the Task 1.1 password-storage flow.

## What was added

- `POST /api/register` stores passwords as Argon2id PHC strings.
- `POST /api/login` verifies passwords without exposing whether the username exists.
- `GET /api/admin/users` is a demo-only endpoint that shows stored hashes for marking/video evidence.
- Passwords are HMAC-peppered server-side before hashing.
- User rows are stored in SQLite at `data/app.db` by default.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`.

Set `PEPPER` in `.env` to a random secret before sharing a demo. If `PEPPER` is not set, the server uses a local demo fallback and prints a warning.
