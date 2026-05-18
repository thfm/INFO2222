#!/usr/bin/env python3
"""
crack_md5.py — Targeted MD5 dictionary attack for the INFO2222 Phase 3
Task 2 vulnerability demonstration.

Usage:
    python crack_md5.py <md5_hash> [<md5_hash> ...]

Output:
    For each cracked hash, prints "<hash> = '<password>'" plus stats.

What it demonstrates:
    MD5 has no salt and no work factor. A 12-character "respectable"
    password like Sunshine2024 follows the predictable human pattern of
    DictionaryWord + Year, so a tiny targeted attack cracks it in
    milliseconds. A real attacker uses hashcat with the rockyou.txt
    wordlist (14 million entries) and GPU acceleration to do this at
    one billion guesses per second.

    This script is intentionally minimal. It tries
    base_word x capitalization x suffix combinations against a small
    built-in dictionary, with the password length filter enforced to
    match the merged app's 12-character minimum requirement.
"""

import hashlib
import sys
import time

# Small dictionary of common base words. A real attacker would use
# rockyou.txt (14M entries) or have-i-been-pwned downloads (847M).
BASE_WORDS = [
    'password', 'welcome', 'admin', 'login', 'letmein',
    'monkey', 'dragon', 'master', 'shadow', 'qwerty',
    'sunshine', 'football', 'baseball', 'iloveyou', 'superman',
    'batman', 'spring', 'summer', 'autumn', 'winter',
    'company', 'office', 'manager', 'student', 'teacher',
    'school', 'computer', 'internet', 'university', 'contritrack',
]

# Common suffix patterns humans add to satisfy length and complexity rules.
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

# Capitalization variants applied to each base word.
def caps(word: str) -> list[str]:
    return [word.lower(), word.upper(), word.capitalize()]

def crack(target_hash: str, min_length: int = 12) -> tuple[str | None, int, float]:
    """Try base_word x caps x suffix combinations against the MD5 target."""
    start = time.perf_counter()
    attempts = 0
    target = target_hash.lower()
    for base in BASE_WORDS:
        for variant in caps(base):
            for suffix in SUFFIXES:
                candidate = variant + suffix
                if len(candidate) < min_length:
                    continue
                attempts += 1
                if hashlib.md5(candidate.encode()).hexdigest() == target:
                    return candidate, attempts, time.perf_counter() - start
    return None, attempts, time.perf_counter() - start

def main() -> int:
    if len(sys.argv) < 2:
        print('Usage: python crack_md5.py <md5_hash> [<md5_hash> ...]')
        print('Example: python crack_md5.py 9a04bf08d27ca5dd9c8e3aa57aab4e34')
        return 1

    for h in sys.argv[1:]:
        result, attempts, elapsed = crack(h)
        if result:
            print(
                f'CRACKED: {h} = {result!r}  '
                f'({attempts:,} tries in {elapsed * 1000:.1f} ms)'
            )
        else:
            print(
                f'No match for {h}  '
                f'(exhausted {attempts:,} candidates in {elapsed * 1000:.1f} ms)'
            )
    return 0

if __name__ == '__main__':
    sys.exit(main())
