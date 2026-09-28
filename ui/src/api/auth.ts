const BASE = "/api/auth";

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: User;
}

export interface ForgotResponse {
  ok: boolean;
  message: string;
  dev_reset_token?: string | null;
}

async function handle<T>(resp: Response): Promise<T> {
  const text = await resp.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  if (!resp.ok) {
    const detail =
      (data && (data.detail || data.message)) ||
      `Request failed (${resp.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data as T;
}

export async function signup(
  email: string,
  name: string,
  password: string,
): Promise<TokenResponse> {
  const resp = await fetch(`${BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });
  return handle<TokenResponse>(resp);
}

export async function signin(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const resp = await fetch(`${BASE}/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle<TokenResponse>(resp);
}

export async function forgotPassword(email: string): Promise<ForgotResponse> {
  const resp = await fetch(`${BASE}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handle<ForgotResponse>(resp);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  const resp = await fetch(`${BASE}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  return handle(resp);
}

export async function fetchMe(token: string): Promise<User> {
  const resp = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle<User>(resp);
}
