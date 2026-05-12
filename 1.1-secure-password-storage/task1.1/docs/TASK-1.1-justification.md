# Task 1.1(a) — Strong Hashing Algorithm: Argon2id

---

## 1. What a strong password-hashing algorithm must be

A password hash should be a one way function stored in place of the plaintext, so that a database breach does not immediately leak every user's password. To be *strong* under the modern threat model, where attackers have access to commodity GPUs, FPGAs, and custom ASICs. A hash function must satisfy **all five** of the following properties:

| # | Property | Why it matters |
|---|---|---|
| 1 | **Deliberately slow** | Raises the per-guess cost for offline brute force. Modern unsalted MD5 runs at ~10⁹ hashes/sec on a single RTX 4090; a tuned Argon2id runs at ~10–30 hashes/sec. Roughly 8 orders of magnitude difference. |
| 2 | **Per-password random salt** | Prevents rainbow-table and precomputation attacks. A unique ≥128-bit salt per user means attackers cannot amortize work across the database — each account must be attacked independently. |
| 3 | **Memory-hard** | Raises the per-guess cost in a way GPUs and ASICs cannot cheat. GPUs have limited VRAM per thread; a function that needs tens of MiB per hash forces serialization and collapses GPU parallelism. Bcrypt is CPU-hard but uses only 4 KiB of state. Argon2 and scrypt are genuinely memory-hard. |
| 4 | **Future-tunable (parameterizable)** | Cost parameters must be upgradable as hardware improves. The stored hash must carry its own parameters so old hashes can be detected and transparently re-hashed on next login — without breaking existing users. |
| 5 | **Constant-time verification** | Verification must not leak information about how close a candidate is to the real password via timing. A naive byte-by-byte comparison leaks via side channels; constant-time comparison is mandatory. |

Additional desirable properties: **side-channel resistance** (data-independent memory access in the first pass of the hash) and **time-memory tradeoff (TMTO) resistance** (attackers cannot reduce memory by spending more time).

## 2. Candidate comparison

| Algorithm | Year | Standardized | Slow | Built-in salt | Memory-hard | Side-channel resistant | TMTO-resistant | OWASP 2024 rank |
|---|---|---|:-:|:-:|:-:|:-:|:-:|---|
| MD5 | 1992 | RFC 1321 (broken for crypto) | ❌ | ❌ | ❌ | ✅ | ❌ | **unacceptable** |
| SHA-256 | 2001 | FIPS 180-4 | ❌ | ❌ | ❌ | ✅ | ❌ | **unacceptable** (fast digest) |
| PBKDF2 | 2000 | RFC 8018 | ✅ tunable | manual | ❌ CPU-only | ✅ | ❌ | legacy-compat only |
| bcrypt | 1999 | de-facto | ✅ | ✅ | weak (4 KiB) | ❌ | ✅ | fallback (72-byte pwd cap) |
| scrypt | 2009 | RFC 7914 | ✅ | manual | ✅ | ❌ | ✅ | fallback |
| **Argon2id** | **2015** | **RFC 9106 (2021)** | ✅ | ✅ embedded | ✅ | ✅ | ✅ | **first choice** |

Key takeaways:
- **MD5, SHA-1, and SHA-256 are fast digests** — designed for integrity checking, not credential storage. Using them for passwords is the exact inverse of what's needed.
- **PBKDF2** is slow but only CPU-hard. A GPU attacker with 16 GiB of VRAM can run ~10,000 parallel PBKDF2 candidates at similar per-candidate cost, annihilating its defense.
- **bcrypt** remains acceptable, but its memory cost is fixed at 4 KiB — a bcrypt-specific ASIC is economical. It also has a hard 72-character password limit that silently truncates.
- **scrypt** is strong but uses data-*dependent* memory access throughout, making it vulnerable to cache-timing side channels in shared-hosting or multi-tenant environments.
- **Argon2id** is the Password Hashing Competition (PHC) winner (2015), standardized as RFC 9106 (2021), and OWASP's explicit "first choice" as of the 2024 Password Storage Cheat Sheet.

## 3. Why Argon2id specifically (not Argon2i or Argon2d)

The Argon2 family has three variants:

- **Argon2d** — uses data-*dependent* memory access. Maximum TMTO resistance, but exposed to side-channel attacks (an attacker watching cache-timing patterns can reconstruct information about the password).
- **Argon2i** — uses data-*independent* memory access. Side-channel-safe, but weaker against TMTO attacks.
- **Argon2id** — **hybrid**: first pass is data-independent (Argon2i-style, side-channel-safe); second pass is data-dependent (Argon2d-style, TMTO-safe). Inherits the best of both.

From RFC 9106 §4: *"If you do not know the difference between the variants or you consider side-channel attacks to be a threat, please select Argon2id."* For a web auth service where attackers may have cloud-host access or shared-tenant positioning, Argon2id is the correct default.

## 4. Chosen parameters (OWASP 2024 first-choice row)

| Parameter | Value | Rationale |
|---|---|---|
| `m` (memoryCost) | **19456 KiB (~19 MiB)** | OWASP-recommended minimum; makes GPU/ASIC attack uneconomic at scale |
| `t` (timeCost) | **2 iterations** | Balances user-facing latency (~50 ms on a 2020 laptop) against attacker cost |
| `p` (parallelism) | **1 lane** | Single-thread on a per-request web auth path; no advantage to increasing |
| `saltLength` | **16 bytes (128 bits)** | NIST SP 800-132 minimum; Argon2 spec minimum |
| `hashLength` | **32 bytes (256 bits)** | Matches SHA-256; sufficient for password-equivalent entropy |

Citations:
- OWASP Password Storage Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
- RFC 9106 — Argon2 Memory-Hard Function (2021): <https://www.rfc-editor.org/rfc/rfc9106.html>
- NIST SP 800-132 — Recommendation for Password-Based Key Derivation (2010): <https://csrc.nist.gov/publications/detail/sp/800-132/final>
- NIST SP 800-63B — Digital Identity Guidelines, Authentication (2017): <https://pages.nist.gov/800-63-3/sp800-63b.html>

## 5. Proper salting in our implementation

Every `hashPassword()` call produces a **fresh 16-byte cryptographically random salt**, generated by libsodium's `randombytes_buf` wrapping OS entropy (`getrandom(2)` on Linux, `BCryptGenRandom` on Windows). The salt is packed into a PHC-format string along with the algorithm identifier, version, parameters, and hash:

```
$argon2id$v=19$m=19456,t=2,p=1$<base64 salt>$<base64 hash>
```

Stored as a single `password_hash` column in SQLite. **There is no separate salt column to get out of sync.** The "lost-salt" bug class is eliminated by construction.

All five "proper salting" requirements are met:

1. **Unique per password** — fresh random bytes on every call (verified by test: 50 concurrent hashes produce 50 distinct salts)
2. **Cryptographically random** — OS CSPRNG via libsodium
3. **Sufficient length** — 128 bits (Argon2 and NIST minimum)
4. **Stored alongside the hash** — PHC format, single column
5. **Not required to be secret** — safety depends on uniqueness, not secrecy (RFC 9106 §3.1)

## 6. The PEPPER Extra defense

Beyond the salt, we apply **HMAC-SHA256** with a server-side secret that lives in .env file (`PEPPER` environment variable) to the password *before* Argon2 runs:

```
PHC_string = argon2id( HMAC-SHA256( PEPPER_key, NFC-normalize(password) ) )
```

This raises the bar for a DB-only breach (in which case the .env file is not leaked): the attacker must **also** compromise the server environment to begin offline cracking. The pepper is **not a replacement for the salt**, it is a parallel defense against a specific (and common) DB only breach scenario where the database leaks but the application config does not.

The password is Unicode-normalized (NFC) before being fed to HMAC, so `"café"` with a composed `é` and `"café"` with `e` + combining acute diacritic hash identically.



## 7. Summary

We use **Argon2id with OWASP 2024 parameters** (m=19456 KiB, t=2, p=1), a 128-bit per password random salt automatically managed by libsodium and embedded in a PHC string, an HMAC-SHA256 pepper secret, constant-time verification via `argon2.verify()`, and automatic rehashing on parameter drift. This is the OWASP "first choice" configuration and satisfies all five requirements for a strong password-hashing algorithm.
