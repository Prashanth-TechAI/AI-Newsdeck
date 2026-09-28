import type { DBArticle } from "../api/articles";
import type { Article, ArticleSummary, Category, Sentiment } from "../types";

const KNOWN_CATEGORIES: Category[] = [
  "Business",
  "Technology",
  "Politics",
  "Sports",
  "Entertainment",
  "Science",
  "World",
  "Health",
  "Finance",
  "Other",
];

function toCategory(c: string | null): Category {
  if (!c) return "Other";
  return (KNOWN_CATEGORIES as string[]).includes(c) ? (c as Category) : "Other";
}

function toSentiment(s: string | null): Sentiment {
  if (s === "positive" || s === "negative") return s;
  return "neutral";
}

function toSummary(s: DBArticle["summary"]): ArticleSummary | null {
  if (!s || s.summary == null) return null;
  return {
    summary: s.summary,
    key_points: s.key_points ?? [],
    category: toCategory(s.category),
    sentiment: toSentiment(s.sentiment),
    importance: s.importance ?? 0,
    relevance: s.relevance ?? 0,
    tags: s.tags ?? [],
  };
}

export function dbToArticle(a: DBArticle): Article {
  return {
    id: `db-${a.id}`,
    keyword: a.keyword ?? "",
    title: a.title,
    url: a.article_url,
    source: a.source_name,
    published_at: a.published_date,
    image_url: a.image_url,
    raw_snippet: "",
    summary: toSummary(a.summary),
    error: null,
  };
}
