export type Category =
  | "Business"
  | "Technology"
  | "Politics"
  | "Sports"
  | "Entertainment"
  | "Science"
  | "World"
  | "Health"
  | "Finance"
  | "Other";

export type Sentiment = "positive" | "neutral" | "negative";

export interface ArticleSummary {
  summary: string;
  key_points: string[];
  category: Category;
  sentiment: Sentiment;
  importance: number;
  relevance: number;
  tags: string[];
}

export interface Article {
  id: string;
  keyword: string;
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  image_url: string | null;
  raw_snippet: string;
  summary: ArticleSummary | null;
  error: string | null;
}

export interface AgentStats {
  keywords?: number;
  search_rounds?: number;
  searches_executed?: number;
  found?: number;
  duplicates?: number;
  unique?: number;
  retries?: number;
  summarized_ok?: number;
  summarized_failed?: number;
  filtered_off_topic?: number;
}

export type AgentStage =
  | "plan"
  | "search"
  | "evaluate"
  | "summarize"
  | "filter"
  | "rank";

export interface AgentTraceEvent {
  stage: AgentStage;
  keyword: string | null;
  detail: Record<string, any>;
}

export interface FetchResponse {
  keywords: string[];
  total_articles: number;
  articles: Article[];
  elapsed_seconds: number;
  stats?: AgentStats;
  trace?: AgentTraceEvent[];
}

export type LayoutMode = "grid" | "category" | "timeline" | "source";

export interface DashboardConfig {
  keywords: string[];
  maxPerKeyword: number;
  daysBack: number;
  searchDepth: "basic" | "advanced";
  layout: LayoutMode;
}
