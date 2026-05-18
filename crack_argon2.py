#!/usr/bin/env python3
"""
crack_argon2.py — same dictionary attack as crack_md5.py, but targeting
an Argon2id PHC string instead of an MD5 hex digest.

Usage:
    python crack_argon2.py "<argon2id_phc_string>"

Note: wrap the PHC string in single quotes (Git Bash) or double quotes
(PowerShell) so the shell does not interpret the $ characters.

What it demonstrates:
    Argon2id is *deliberately* slow and memory-hard. Where MD5 runs at
    ~1 billion guesses per second on a single CPU core, Argon2id with the
    OWASP 2024 parameters (m=19456 KiB, t=2, p=1) runs at ~10-20 guesses
    per second on the same hardware. That is approximately a 50,000,000x
    slowdown per guess.

    This script runs a small sample of real verifies to measure the per-guess
    cost on your machine, then extrapolates how long the same attack that
    cracked MD5 in 30 milliseconds would take against Argon2id.

Dependency:
    pip install argon2-cffi
"""

import sys
import time

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError, InvalidHashError
except ImportError:
    print('ERROR: argon2-cffi is not installed.')
    print('Install with:  pip install argon2-cffi')
    sys.exit(1)

ph = PasswordHasher()

# Same dictionary as crack_md5.py for an apples-to-apples comparison.
BASE_WORDS = [
    'password', 'welcome', 'admin', 'login', 'letmein',
    'monkey', 'dragon', 'master', 'shadow', 'qwerty',
    'sunshine', 'football', 'baseball', 'iloveyou', 'superman',
    'batman', 'spring', 'summer', 'autumn', 'winter',
    'company', 'office', 'manager', 'student', 'teacher',
    'school', 'computer', 'internet', 'university', 'contritrack',
]

SUFFIXES = (
    ['']
    + [str(n) for n in range(10000)]
    + [
        '!', '!!', '!!!', '@', '#', '$', '*',
        '!1', '@1', '#1',
        '!23', '!2024', '2024', '2024!', '2024!!',
        '!2025', '2025', '2025!', '2025!!',
        '2023', '2023!', '!2023',
    ]
)

def caps(word: str) -> list[str]:
    return [word.lower(), word.upper(), word.capitalize()]

def candidates(min_length: int = 12):
    for base in BASE_WORDS:
        for variant in caps(base):
            for suffix in SUFFIXES:
                candidate = variant + suffix
                if len(candidate) >= min_length:
                    yield candidate

def count_candidates() -> int:
    return sum(1 for _ in candidates())

def measure(stored_phc: str, sample_size: int = 20) -> tuple[str | None, int, float]:
    """Run sample_size real Argon2id verifies and report timing."""
    print(f'Running {sample_size} real Argon2id verifies to measure per-guess cost...')
    start = time.perf_counter()
    cracked = None
    used = 0
    for candidate in candidates():
        if used >= sample_size:
            break
        used += 1
        try:
            ph.verify(stored_phc, candidate)
            cracked = candidate
            break
        except VerifyMismatchError:
            pass
        except InvalidHashError as exc:
            print(f'ERROR: argon2 could not parse the PHC string: {exc}')
            sys.exit(1)
        if used % 5 == 0:
            print(f'  ... {used}/{sample_size} verified ({time.perf_counter() - start:.1f}s)')
    elapsed = time.perf_counter() - start
    per_guess = elapsed / used if used > 0 else 0.0
    return cracked, used, per_guess

def fmt_duration(seconds: float) -> str:
    if seconds < 60:
        return f'{seconds:.1f} seconds'
    if seconds < 3600:
        return f'{seconds / 60:.1f} minutes'
    if seconds < 86400:
        return f'{seconds / 3600:.1f} hours'
    if seconds < 86400 * 365:
        return f'{seconds / 86400:.1f} days'
    return f'{seconds / 86400 / 365:.1f} years'

def main() -> int:
    if len(sys.argv) < 2:
        print('Usage:  python crack_argon2.py "<argon2id_phc_string>"')
        print('Tip:    quote the PHC string so $ is not interpreted by the shell.')
        return 1

    phc = sys.argv[1]
    if not phc.startswith('$argon2'):
        print(f'ERROR: argument does not look like an Argon2id PHC string.')
        print(f'       Got: {phc[:60]!r}')
        print(f'       Expected something starting with "$argon2id$v=19$..."')
        print(f'Tip: in Git Bash use single quotes, in PowerShell use double quotes,')
        print(f'     so the shell does not interpret the $ characters.')
        return 1
    print(f'Target: {phc[:60]}{"..." if len(phc) > 60 else ""}\n')

    total = count_candidates()
    print(f'Dictionary contains {total:,} candidates passing the 12-character filter.\n')

    cracked, used, per_guess = measure(phc)

    print(f'\nMeasured per-guess cost: {per_guess * 1000:.0f} ms')
    print(f'Effective throughput:    {1 / per_guess:.1f} guesses/second on this CPU')

    if cracked:
        print(f'\nCRACKED in {used} attempts: {cracked!r}')
    else:
        print(f'\nNo match in {used} sample attempts (deliberate -- extrapolating instead).')

    print('\nProjected time to exhaust attack against this hash:')
    rockyou = 14_344_392
    hibp = 847_223_402
    print(f'  {total:>12,} candidates (this dictionary):  {fmt_duration(total * per_guess)}')
    print(f'  {rockyou:>12,} candidates (rockyou.txt):    {fmt_duration(rockyou * per_guess)}')
    print(f'  {hibp:>12,} candidates (HIBP 2024):       {fmt_duration(hibp * per_guess)}')

    md5_per_guess = 1.0 / 1_000_000_000
    slowdown = per_guess / md5_per_guess
    print('\nFor comparison:')
    print(f'  MD5      throughput: ~1,000,000,000 guesses/second on this CPU')
    print(f'  Argon2id throughput: ~{1 / per_guess:.0f} guesses/second on this CPU')
    print(f'  Argon2id is approximately {slowdown:,.0f}x slower than MD5 per guess.\n')

    return 0

if __name__ == '__main__':
    sys.exit(main())
