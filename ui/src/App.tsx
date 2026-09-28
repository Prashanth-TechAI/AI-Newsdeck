import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { EmptyState } from "./components/EmptyState";
import { AgentTrace } from "./components/AgentTrace";
import { Analytics } from "./components/Analytics";
import {
  FilterBar,
  EMPTY_FILTERS,
  applyFilters,
  isEmptyFilters,
  type FilterState,
} from "./components/FilterBar";
import { FeaturedArticle, pickFeatured } from "./components/FeaturedArticle";
import { fetchNews } from "./api/client";
import { listArticles } from "./api/articles";
import { dbToArticle } from "./lib/normalize";
import type { DashboardConfig, FetchResponse } from "./types";

const DEFAULT_CONFIG: DashboardConfig = {
  keywords: [],
  maxPerKeyword: 6,
  daysBack: 5,
  searchDepth: "advanced",
  layout: "grid",
};

type ViewMode = "run" | "history";

export default function App() {
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [runResult, setRunResult] = useState<FetchResponse | null>(null);
  const [historyResult, setHistoryResult] = useState<FetchResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("history");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [lastRunZero, setLastRunZero] = useState(false);

  // Load already-collected articles from the DB on mount so the dashboard
  // isn't empty when the user opens it after the scheduler has run.
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await listArticles({
        days: 14,
        limit: 60,
        sort: "newest",
      });
      if (r.items.length > 0) {
        setHistoryResult({
          keywords: Array.from(
            new Set(r.items.map((a) => a.keyword).filter(Boolean) as string[]),
          ),
          total_articles: r.items.length,
          articles: r.items.map(dbToArticle),
          elapsed_seconds: 0,
          stats: {},
          trace: [],
        });
      } else {
        setHistoryResult(null);
      }
    } catch {
      // silent — backend might be cold; user can still click Run agent.
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRun = async () => {
    setLoading(true);
    setError(null);
    setLastRunZero(false);
    try {
      const r = await fetchNews(config);
      setRunResult(r);
      setFilters(EMPTY_FILTERS);
      if (r.total_articles > 0) {
        setViewMode("run");
      } else {
        setLastRunZero(true);
        setViewMode("history");
      }
      // refresh DB list in background so toggling to history reflects this run
      loadHistory();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const result =
    viewMode === "run"
      ? runResult ?? historyResult
      : historyResult ?? runResult;

  const onChangeView = (m: ViewMode) => {
    if (m === viewMode) return;
    setViewMode(m);
    setFilters(EMPTY_FILTERS);
    setLastRunZero(false);
  };

  const filteredArticles = useMemo(
    () => (result ? applyFilters(result.articles, filters) : []),
    [result, filters],
  );

  const featured = useMemo(
    () =>
      result && config.layout === "grid" && isEmptyFilters(filters)
        ? pickFeatured(result.articles)
        : null,
    [result, config.layout, filters],
  );

  const gridArticles = useMemo(() => {
    if (!featured) return filteredArticles;
    return filteredArticles.filter((a) => a.id !== featured.id);
  }, [filteredArticles, featured]);

  const addKeyword = (k: string) => {
    if (config.keywords.includes(k)) return;
    if (config.keywords.length >= 10) return;
    setConfig({ ...config, keywords: [...config.keywords, k] });
  };

  return (
    <div className="h-full flex bg-white text-slate-900">
      <Sidebar
        config={config}
        onChange={setConfig}
        onRun={onRun}
        loading={loading}
      />

      <main className="flex-1 overflow-y-auto bg-slate-50/40 bg-app-mesh relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -z-0">
          <div className="orb bg-accent/30 w-[460px] h-[460px] -top-32 -left-32" />
          <div className="orb bg-fuchsia-400/25 w-[420px] h-[420px] -top-40 right-[-120px]" />
        </div>
        <Header
          result={result}
          loading={loading}
          viewMode={viewMode}
          onChangeView={onChangeView}
          hasRun={!!runResult}
          hasHistory={!!historyResult}
        />

        <div className="px-8 py-7 relative">
          {lastRunZero && !loading && (
            <div className="card border-amber-200 bg-amber-50 p-3.5 mb-4 flex items-start gap-3 max-w-3xl animate-fadeUp">
              <AlertTriangle
                className="text-amber-600 shrink-0 mt-0.5"
                size={16}
              />
              <div className="flex-1 text-sm text-amber-900">
                <p className="font-semibold">
                  Latest search returned 0 articles.
                </p>
                <p className="text-amber-800/90 mt-0.5 text-[12.5px]">
                  Tavily didn’t have on-topic results for those keywords. Showing
                  your previously collected articles below. Try more specific
                  keywords (e.g. <em>"dengue Tamil Nadu 2025"</em> instead of
                  just <em>"dengue"</em>).
                </p>
              </div>
              <button
                onClick={() => setLastRunZero(false)}
                className="text-amber-600 hover:text-amber-900 shrink-0"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
          {error && (
            <div className="card border-rose-200 bg-rose-50 p-4 mb-6 flex items-start gap-3 max-w-3xl animate-fadeUp">
              <AlertTriangle
                className="text-rose-600 shrink-0 mt-0.5"
                size={18}
              />
              <div>
                <p className="font-semibold text-rose-800">Agent run failed</p>
                <p className="text-sm text-rose-700/90 mt-1 font-mono break-all">
                  {error}
                </p>
              </div>
            </div>
          )}

          {!result && !loading && !error && !historyLoading && (
            <EmptyState onAddKeyword={addKeyword} />
          )}

          {historyLoading && !result && !loading && (
            <div className="card p-8 text-center text-sm text-slate-500">
              <Loader2 className="inline-block animate-spin mr-2" size={14} />
              Loading collected articles…
            </div>
          )}

          {loading && <LoadingState keywords={config.keywords} />}

          {result && result.articles.length === 0 && !loading && (
            <div className="card p-10 text-center text-slate-500 max-w-xl mx-auto mt-12">
              <p className="font-semibold text-slate-700 mb-1">No articles found</p>
              <p className="text-sm">
                Try different keywords or increase “days back”.
              </p>
            </div>
          )}

          {result && result.trace && result.trace.length > 0 && (
            <AgentTrace trace={result.trace} keywords={result.keywords} />
          )}

          {result && result.articles.length > 0 && (
            <Analytics articles={result.articles} />
          )}

          {result && result.articles.length > 0 && (
            <FilterBar
              articles={result.articles}
              filters={filters}
              onChange={setFilters}
              filteredCount={filteredArticles.length}
            />
          )}

          {featured && <FeaturedArticle article={featured} />}

          {result &&
            result.articles.length > 0 &&
            filteredArticles.length === 0 &&
            !loading && (
              <div className="card p-8 text-center text-slate-500 max-w-xl mx-auto mt-4">
                <p className="font-semibold text-slate-700 mb-1">
                  No articles match these filters
                </p>
                <p className="text-sm">
                  Try clearing one of the filter chips above.
                </p>
              </div>
            )}

          {result && filteredArticles.length > 0 && (
            <Dashboard articles={gridArticles} layout={config.layout} />
          )}
        </div>
      </main>
    </div>
  );
}

function LoadingState({ keywords }: { keywords: string[] }) {
  return (
    <div className="animate-fadeUp">
      <div className="card-premium p-5 mb-6 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-brand-gradient opacity-40 blur-md animate-pulseGlow" />
            <div className="relative w-9 h-9 rounded-xl bg-brand-gradient text-white grid place-items-center shadow-glow">
              <Loader2 size={16} className="animate-spin" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-slate-900">
              Fetching the latest news{keywords.length > 0 ? " for" : ""}
              {keywords.length > 0 && (
                <span className="text-slate-700"> {keywords.length} {keywords.length === 1 ? "keyword" : "keywords"}</span>
              )}
              …
            </p>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Searching trusted sources, removing duplicates, summarizing with AI.
            </p>
          </div>
        </div>
        <div className="progress-bar h-1 mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card p-4 space-y-3 overflow-hidden animate-fadeUp"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="aspect-[16/9] -mx-4 -mt-4 skeleton-shimmer rounded-t-xl" />
            <div className="flex gap-2">
              <div className="h-4 w-16 rounded-full skeleton-shimmer" />
              <div className="h-4 w-20 rounded-full skeleton-shimmer" />
            </div>
            <div className="h-5 w-5/6 rounded skeleton-shimmer" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded skeleton-shimmer" />
              <div className="h-3 w-11/12 rounded skeleton-shimmer" />
              <div className="h-3 w-4/5 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
