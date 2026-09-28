import { getToken } from "../auth/storage";

const BASE = "/api/keywords";

export interface Keyword {
  id: number;
  text: string;
  is_active: boolean;
  created_at: string;
  last_fetched_at: string | null;
  created_by_id: number | null;
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle<T>(resp: Response): Promise<T> {
  if (resp.status === 204) return undefined as unknown as T;
  const text = await resp.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* */
  }
  if (!resp.ok) {
    const detail =
      (data && (data.detail || data.message)) || `Request failed (${resp.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data as T;
}

export async function listKeywords(includeInactive = false): Promise<Keyword[]> {
  const url = includeInactive ? `${BASE}?include_inactive=true` : BASE;
  return handle<Keyword[]>(await fetch(url, { headers: authHeaders() }));
}

export async function createKeyword(text: string): Promise<Keyword> {
  return handle<Keyword>(
    await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ text }),
    }),
  );
}

export async function updateKeyword(
  id: number,
  patch: { text?: string; is_active?: boolean },
): Promise<Keyword> {
  return handle<Keyword>(
    await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  );
}

export async function deleteKeyword(id: number): Promise<void> {
  await handle<void>(
    await fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
  );
}
