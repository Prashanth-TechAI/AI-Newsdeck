import { getToken } from "../auth/storage";

const BASE = "/api";

export type Sentiment = "positive" | "neutral" | "negative";

export interface ArticleSummary {
  summary: string | null;
  category: string | null;
  sentiment: Sentiment | null;
  importance: number | null;
  relevance: number | null;
  key_points: string[] | null;
  tags: string[] | null;
}

export interface DBArticle {
  id: number;
  title: string;
  source_name: string;
  article_url: string;
  published_date: string | null;
  image_url: string | null;
  keyword: string | null;
  created_at: string;
  summary: ArticleSummary;
}

export interface ArticleListResponse {
  total: number;
  limit: number;
  offset: number;
  items: DBArticle[];
}

export interface DistributionItem {
  label: string;
  count: number;
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  window_days: number;
  total: number;
  by_category: DistributionItem[];
  by_sentiment: DistributionItem[];
  by_source: DistributionItem[];
  by_keyword: DistributionItem[];
  by_importance: DistributionItem[];
  timeline: TimelinePoint[];
}

export interface ArticleQuery {
  keyword?: string;
  category?: string;
  sentiment?: string;
  source?: string;
  q?: string;
  min_importance?: number;
  days?: number;
  sort?: "newest" | "oldest" | "importance" | "relevance";
  limit?: number;
  offset?: number;
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function toQS(obj: Record<string, any>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function handle<T>(resp: Response): Promise<T> {
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

export async function listArticles(q: ArticleQuery = {}): Promise<ArticleListResponse> {
  const resp = await fetch(`${BASE}/articles${toQS(q)}`, { headers: authHeaders() });
  return handle<ArticleListResponse>(resp);
}

export async function getAnalytics(
  days = 7,
  keyword?: string,
): Promise<AnalyticsResponse> {
  const resp = await fetch(
    `${BASE}/analytics${toQS({ days, keyword })}`,
    { headers: authHeaders() },
  );
  return handle<AnalyticsResponse>(resp);
}

export interface SchedulerStatus {
  enabled: boolean;
  interval_minutes: number;
  running: boolean;
  next_run_at: string | null;
  in_flight: boolean;
  last_run: {
    id: number;
    triggered_by: string;
    started_at: string;
    finished_at: string | null;
    status: string;
    keywords_processed: number;
    articles_found: number;
    articles_persisted: number;
    elapsed_seconds: number | null;
    error_message: string | null;
  } | null;
}

export async function getSchedulerStatus(): Promise<SchedulerStatus> {
  return handle<SchedulerStatus>(
    await fetch(`${BASE}/scheduler/status`, { headers: authHeaders() }),
  );
}

export async function runSchedulerNow(): Promise<{ ok: boolean; message: string }> {
  return handle<{ ok: boolean; message: string }>(
    await fetch(`${BASE}/scheduler/run-now`, {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}
