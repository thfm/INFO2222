# Task 1.1 Demo Script — Secure Password Storage

Recording flow for the INFO2222 Phase 3 Task 1.1 video. Demonstrates secure password storage (Argon2id + per-user salt + server-side pepper) and the contrasting vulnerability when unsalted MD5 is used instead. Attack tool: [CrackStation](https://crackstation.net) (browser, no install).

**Venue:** `merged/` app, `https://localhost:3000`. **Target length:** 3–4 minutes.

---

## Pre-recording checklist

Do all of these BEFORE pressing record.

| # | Step | Command / Action |
|---|---|---|
| 1 | Confirm WEAK_MODE port is applied | `merged/server/crypto/weak.ts` exists, `merged/server/crypto/index.ts` reads `process.env.WEAK_MODE` |
| 2 | Generate certs if missing | `bash generate-certs.sh` from repo root (creates `certs/ca.crt`, `certs/server.{key,crt}`) |
| 3 | Trust `certs/ca.crt` in OS/browser | Avoids browser cert warning on camera. Or pre-roll a 5-sec "ignore warning" intro. |
| 4 | Install merged deps | `cd merged && npm install` (only first time) |
| 5 | Verify demo pepper is set | `cat merged/.env` should show `PEPPER=...32+chars...` |
| 6 | Clear any old DB | `rm merged/data/app.db` (server also wipes on startup; clean slate is reassuring) |
| 7 | Open Chrome/Edge, DevTools console docked right | You will paste `fetch` calls in the console for register/login |
| 8 | Open a second tab to `https://crackstation.net` | Pre-loaded, ready to paste |
| 9 | Close all unrelated tabs, silence notifications, unmute mic | Standard recording hygiene |
| 10 | Trial recording, 10 sec, play back | Confirms screen recorder captures audio + cursor |

## How to switch between weak and strong mode

The switch is a single environment variable read **once at server boot**. Stop the server (`Ctrl-C`) and restart to flip modes.

### PowerShell (Windows, default shell here)

```powershell
# Strong (default)
npm run dev

# Weak
$env:WEAK_MODE=1; npm run dev

# Reset after demo so weak mode does not linger
Remove-Item Env:WEAK_MODE
```

### Git Bash / WSL / macOS / Linux

```bash
# Strong (default)
npm run dev

# Weak
WEAK_MODE=1 npm run dev
```

### Banner confirms the active mode

```
[contritrack] Secure password storage: argon2id    ← strong
[contritrack] Secure password storage: md5-weak    ← weak
```

The DB is wiped on every restart (`clearUsers(db)` in `merged/server/index.ts:20`), so each mode starts with a clean user table. Cross-mode login is intentionally broken — a user registered in one mode cannot log in after switching modes.

---

## Scene-by-scene script

> Voiceover lines are in *italics*. Commands you type live are in `code blocks`. Camera focus / browser action in [brackets].

### Scene 1 — Intro (~20 sec)

[Camera on terminal in `merged/` directory, then on text editor showing `merged/server/crypto/password.ts`]

> *"This is ContriTrack, our INFO2222 Phase 3 group project. Today I'm demonstrating secure password storage: how we hash credentials with Argon2id so a database breach does not leak our users' passwords, and what would happen if we had used unsalted MD5 instead. I'll show both modes running on the same app, then prove with a real-world tool that the weak version is trivially crackable."*

### Scene 2 — Strong mode boot (~25 sec)

[Camera on terminal]

```powershell
npm run dev
```

[Highlight the relevant lines in output:]

```
[contritrack] Secure password storage: argon2id
[contritrack] Running on https://localhost:3000
```

> *"The server starts on HTTPS — that's Task 1, server authentication. The banner confirms we are in strong mode: Argon2id hashing."*

### Scene 3 — Register two users with the same password (~40 sec)

[Switch to browser at `https://localhost:3000`, open DevTools → Console]

Paste:

```javascript
await fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'alice', password:'password123'})}).then(r=>r.json())
```

[Expected response: `{id: 1, username: "alice", algorithm: "argon2id"}`]

```javascript
await fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'bob', password:'password123'})}).then(r=>r.json())
```

[Expected: `{id: 2, username: "bob", algorithm: "argon2id"}`]

> *"I just registered Alice and Bob with the same password — 'password123'. Now I'll dump what the server actually stores."*

```javascript
await fetch('/api/admin/users').then(r=>r.json())
```

[Expected response shows both users with `password_hash` starting with `$argon2id$v=19$m=19456,t=2,p=1$...` and **different** salts/hashes.]

> *"Look at this. Same password, completely different stored hashes. That is the per-user salt at work — even if an attacker steals this entire database, they have to crack every user independently. No rainbow tables, no precomputation, no amortization. And each guess costs nineteen megabytes of memory and fifty milliseconds of CPU. This is what OWASP recommends for 2024."*

### Scene 4 — Switch to weak mode (~15 sec)

[Camera back on terminal]

[Ctrl-C to stop server]

```powershell
$env:WEAK_MODE=1; npm run dev
```

[Highlight new banner:]

```
[contritrack] Secure password storage: md5-weak
[contritrack] User records cleared on startup
```

> *"Same code, same database, same HTTPS — but I've flipped one environment variable that swaps the hashing algorithm to unsalted MD5. The startup banner confirms 'md5-weak'. The user table is wiped, so we start clean."*

### Scene 5 — Register the same users in weak mode (~30 sec)

[Back to browser DevTools console]

Re-paste the two register calls and the admin dump from Scene 3.

[Expected: both users now have `algorithm: "md5-weak"` and `password_hash` is a 32-character hex string. **Both hashes are IDENTICAL** because there is no salt.]

> *"Same registration, same password, but now the stored hashes are identical — `482c811da5d5b4bc6d497ffa98491e38`. No salt means same password produces the same hash, every time, forever. An attacker who steals this database immediately knows Alice and Bob share a password, and only has to crack it once."*

### Scene 6 — CrackStation attack (~40 sec)

[Switch to CrackStation tab, `https://crackstation.net`]

Copy alice's hash → paste into the textbox → solve CAPTCHA if shown → click "Crack Hashes".

[Result appears: hash → `password123`, time taken displayed]

> *"That is a free, public website. No attacker tools, no hashcat, no GPU farm. CrackStation runs the hash against a precomputed table of fifteen billion common passwords. Anyone on the internet can do this. The MD5 hash gave up 'password123' in under a second."*

[Now paste alice's Argon2id PHC string from Scene 3 into CrackStation]

[Expected: "Not found in our lookup tables" or rejection because PHC strings are not supported]

> *"And here is the Argon2id hash from strong mode. CrackStation refuses it. Even if an attacker built their own Argon2id rainbow table, the salt makes the table useless — they would need a separate table for every user. With the memory cost we configured, building one entry takes nineteen megabytes — a billion entries is nineteen petabytes. It is economically impossible at scale."*

### Scene 7 — Wrap (~15 sec)

[Camera briefly on `merged/server/crypto/password.ts` and `merged/server/crypto/pepper.ts`]

> *"That is the difference between secure and broken password storage. Argon2id with a 16-byte per-user salt and a server-side HMAC pepper resists rainbow tables, GPU farms, and database breaches. Unsalted MD5 — what was standard practice 20 years ago — gives the entire database away in seconds. The full justification with citations to OWASP, NIST, and RFC 9106 is in `1.1-secure-password-storage/task1.1/docs/TASK-1.1-justification.md`."*

---

## Verification checkpoints (do during dry-run, before real take)

- [ ] Strong-mode `/api/admin/users` shows `$argon2id$v=19$m=19456,t=2,p=1$...` for both users
- [ ] Strong-mode hashes for alice and bob are **different** (proves salt)
- [ ] Weak-mode `/api/admin/users` shows 32-char hex hashes for both users
- [ ] Weak-mode hashes for alice and bob are **identical** (proves no salt)
- [ ] CrackStation cracks alice's MD5 hash and returns `password123`
- [ ] CrackStation rejects alice's Argon2id hash
- [ ] Both modes work over HTTPS (URL bar shows lock icon, no cert warning if CA trusted)
- [ ] Mode banner in terminal correctly reflects strong vs weak

## Post-recording

- [ ] Reset env var: `Remove-Item Env:WEAK_MODE` (PowerShell) or close the terminal
- [ ] Restart in strong mode (`npm run dev` without `WEAK_MODE`) so the repo state is "production safe" again
- [ ] Optional captioning pass to overlay key terms: Argon2id, salt, pepper, MD5, rainbow table
- [ ] Save raw + edited cuts somewhere safe
- [ ] Submit per group submission process

## Why this design is safe

WEAK_MODE is a deliberately weak path. The safety boundary that keeps it from leaking into production:

1. **Off by default.** `process.env.WEAK_MODE === '1'` is the only enable condition. Unset or any other value → strong mode.
2. **Boot-time visible.** Mode is logged on every startup. Anyone running the server sees the active algorithm immediately.
3. **Audit column.** Every user row stores its `algorithm` value, so a database inspection reveals which mode minted each credential.
4. **Fail-closed cross-mode verifier.** A user registered under one mode cannot log in under the other — both verifiers reject hash formats from the opposite mode.
5. **Demo-only admin dump.** `/api/admin/users` exists solely for demonstration. It is documented as "never deploy this" in `merged/server/routes/admin.ts`.

Never deploy a build with `WEAK_MODE=1` set in production environment variables.
