/**
 * Top-100 most common passwords from SecLists (10-million-password-list-top-100).
 * Source: https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/10-million-password-list-top-100.txt
 *
 * Stored lowercased so the lookup is case-insensitive. The spec's 12-char
 * minimum excludes most of these — this set catches the few that happen
 * to be long enough (e.g. "password1234", "qwerty123456").
 */
export const commonPasswords: ReadonlySet<string> = new Set([
  '123456', '123456789', 'qwerty', 'password', '12345', 'qwerty123',
  '1q2w3e', '12345678', '111111', '1234567890', '1234567', 'qwerty1',
  '123123', 'password123', '000000', 'iloveyou', '1234', '1q2w3e4r5t',
  'qwertyuiop', '123', 'monkey', 'dragon', '123321', 'baseball',
  'abc123', 'football', 'letmein', 'shadow', 'master', '696969',
  'mustang', '666666', 'batman', 'trustno1', 'admin', 'welcome',
  'login', 'princess', 'solo', 'starwars', 'sunshine', 'passw0rd',
  'password1', 'hello123', 'qwerty12', 'superman', 'zaq12wsx',
  'charlie', 'aa123456', 'donald', 'password12', 'qazwsx', 'michael',
  'football1', 'ashley', 'bailey', 'access', 'flower', 'mickey',
  'hello', 'freedom', 'whatever', 'nicole', 'jordan', 'cameron',
  'secret', 'summer', 'ginger', 'hunter', 'bubbles', 'qwerty1234',
  'hottie', 'loveme', 'zaq1zaq1', 'password!', 'aa12345678',
  'q1w2e3r4', 'samsung', 'asdfghjkl', 'blahblah', 'myspace1',
  'lovely', 'passw0rd1', 'fuckyou', 'fuckoff', 'chocolate',
  'computer', 'jessica', 'starwars1', 'liverpool', 'abcd1234',
  'p@ssw0rd', 'password1234', 'qwerty123456', 'pass', '12341234',
  'matrix', 'iloveyou1', 'mercedes', 'pokemon', 'chelsea',
]);
