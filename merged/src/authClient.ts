export type AuthUser = {
  id: number;
  username: string;
  algorithm: string;
};

export type StoredUser = {
  id: number;
  username: string;
  password_hash: string;
  algorithm: string;
  created_at: string;
  last_login_at: string | null;
};

async function postCredentials(
  path: '/api/register' | '/api/login',
  username: string,
  password: string,
): Promise<AuthUser> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? 'Authentication failed');
  }
  return payload as AuthUser;
}

export function register(username: string, password: string): Promise<AuthUser> {
  return postCredentials('/api/register', username, password);
}

export function login(username: string, password: string): Promise<AuthUser> {
  return postCredentials('/api/login', username, password);
}

export async function listStoredUsers(): Promise<StoredUser[]> {
  const response = await fetch('/api/admin/users');
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load stored users');
  }
  return payload.users as StoredUser[];
}
