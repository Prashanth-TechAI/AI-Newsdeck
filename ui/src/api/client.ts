import type { DashboardConfig, FetchResponse } from "../types";
import { getToken } from "../auth/storage";

const BASE_URL = "/api";

export async function fetchNews(cfg: DashboardConfig): Promise<FetchResponse> {
  const token = getToken();
  const resp = await fetch(`${BASE_URL}/news/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      keywords: cfg.keywords,
      max_per_keyword: cfg.maxPerKeyword,
      days_back: cfg.daysBack,
      search_depth: cfg.searchDepth,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Fetch failed (${resp.status}): ${text}`);
  }
  return resp.json();
}

export async function health(): Promise<{ status: string; model: string }> {
  const resp = await fetch(`${BASE_URL}/health`);
  return resp.json();
}
