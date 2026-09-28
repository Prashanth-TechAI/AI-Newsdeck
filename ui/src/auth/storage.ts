const KEY = "ainm.auth";

export interface StoredAuth {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    is_admin: boolean;
    created_at: string;
    last_login_at: string | null;
  };
}

export function getStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function setStored(auth: StoredAuth | null) {
  if (auth) {
    localStorage.setItem(KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(KEY);
  }
}

export function getToken(): string | null {
  return getStored()?.token ?? null;
}
