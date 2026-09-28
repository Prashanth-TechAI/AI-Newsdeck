import { useMemo } from "react";
import { Filter, X } from "lucide-react";
import type { Article, Sentiment } from "../types";

export interface FilterState {
  categories: Set<string>;
  sentiments: Set<Sentiment>;
  sources: Set<string>;
}

export const EMPTY_FILTERS: FilterState = {
  categories: new Set(),
  sentiments: new Set(),
  sources: new Set(),
};

export function isEmptyFilters(f: FilterState): boolean {
  return (
    f.categories.size === 0 &&
    f.sentiments.size === 0 &&
    f.sources.size === 0
  );
}

export function applyFilters(
  articles: Article[],
  f: FilterState,
): Article[] {
  if (isEmptyFilters(f)) return articles;
  return articles.filter((a) => {
    if (f.categories.size > 0) {
      const c = a.summary?.category ?? "Other";
      if (!f.categories.has(c)) return false;
    }
    if (f.sentiments.size > 0) {
      const s = a.summary?.sentiment;
      if (!s || !f.sentiments.has(s)) return false;
    }
    if (f.sources.size > 0 && !f.sources.has(a.source)) return false;
    return true;
  });
}

const CATEGORY_TONE: Record<string, string> = {
  Business: "border-amber-200 bg-amber-50 text-amber-800",
  Technology: "border-indigo-200 bg-indigo-50 text-indigo-800",
  Politics: "border-rose-200 bg-rose-50 text-rose-800",
  Sports: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Entertainment: "border-pink-200 bg-pink-50 text-pink-800",
  Science: "border-cyan-200 bg-cyan-50 text-cyan-800",
  World: "border-sky-200 bg-sky-50 text-sky-800",
  Health: "border-lime-200 bg-lime-50 text-lime-800",
  Finance: "border-yellow-200 bg-yellow-50 text-yellow-800",
  Other: "border-slate-200 bg-slate-50 text-slate-700",
};

const SENTIMENT_DOT: Record<Sentiment, string> = {
  positive: "bg-emerald-500",
  neutral: "bg-slate-400",
  negative: "bg-rose-500",
};

interface Props {
  articles: Article[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
  filteredCount: number;
}

export function FilterBar({
  articles,
  filters,
  onChange,
  filteredCount,
}: Props) {
  const { catCounts, sentCounts, sourceCounts } = useMemo(() => {
    const cat: Record<string, number> = {};
    const sent: Record<string, number> = {};
    const src: Record<string, number> = {};
    for (const a of articles) {
      const c = a.summary?.category;
      if (c) cat[c] = (cat[c] ?? 0) + 1;
      const s = a.summary?.sentiment;
      if (s) sent[s] = (sent[s] ?? 0) + 1;
      src[a.source] = (src[a.source] ?? 0) + 1;
    }
    return {
      catCounts: Object.entries(cat).sort((a, b) => b[1] - a[1]),
      sentCounts: (["positive", "neutral", "negative"] as Sentiment[])
        .map((k) => [k, sent[k] ?? 0] as [Sentiment, number])
        .filter(([, v]) => v > 0),
      sourceCounts: Object.entries(src).sort((a, b) => b[1] - a[1]),
    };
  }, [articles]);

  const empty = isEmptyFilters(filters);

  const toggleCategory = (c: string) => {
    const next = new Set(filters.categories);
    next.has(c) ? next.delete(c) : next.add(c);
    onChange({ ...filters, categories: next });
  };
  const toggleSentiment = (s: Sentiment) => {
    const next = new Set(filters.sentiments);
    next.has(s) ? next.delete(s) : next.add(s);
    onChange({ ...filters, sentiments: next });
  };
  const toggleSource = (s: string) => {
    const next = new Set(filters.sources);
    next.has(s) ? next.delete(s) : next.add(s);
    onChange({ ...filters, sources: next });
  };
  const clearAll = () => onChange({ ...EMPTY_FILTERS });

  return (
    <div className="card p-4 mb-6 animate-fadeUp">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent grid place-items-center">
          <Filter size={14} />
        </span>
        <h3 className="text-[13px] font-semibold text-slate-900">Filters</h3>
        <span className="text-[11px] text-slate-500">
          {empty
            ? `${articles.length} ${articles.length === 1 ? "article" : "articles"}`
            : `${filteredCount} of ${articles.length} match`}
        </span>
        {!empty && (
          <button
            onClick={clearAll}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 rounded-md px-2 py-1 hover:bg-slate-100 transition"
          >
            <X size={11} />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {catCounts.length > 0 && (
          <FilterRow label="Category">
            {catCounts.map(([name, n]) => {
              const active = filters.categories.has(name);
              return (
                <FilterChip
                  key={name}
                  active={active}
                  onClick={() => toggleCategory(name)}
                  toneClass={CATEGORY_TONE[name] ?? CATEGORY_TONE.Other}
                >
                  {name}
                  <span className="text-[10px] text-slate-400 font-semibold ml-0.5">
                    {n}
                  </span>
                </FilterChip>
              );
            })}
          </FilterRow>
        )}

        {sentCounts.length > 0 && (
          <FilterRow label="Sentiment">
            {sentCounts.map(([name, n]) => {
              const active = filters.sentiments.has(name);
              return (
                <FilterChip
                  key={name}
                  active={active}
                  onClick={() => toggleSentiment(name)}
                  toneClass="border-slate-200 bg-slate-50 text-slate-700"
                >
                  <span
                    className={"w-1.5 h-1.5 rounded-full " + SENTIMENT_DOT[name]}
                  />
                  <span className="capitalize">{name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold ml-0.5">
                    {n}
                  </span>
                </FilterChip>
              );
            })}
          </FilterRow>
        )}

        {sourceCounts.length > 0 && (
          <FilterRow label="Source">
            {sourceCounts.slice(0, 12).map(([name, n]) => {
              const active = filters.sources.has(name);
              return (
                <FilterChip
                  key={name}
                  active={active}
                  onClick={() => toggleSource(name)}
                  toneClass="border-slate-200 bg-slate-50 text-slate-700"
                >
                  <span className="truncate max-w-[140px]">{name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold ml-0.5">
                    {n}
                  </span>
                </FilterChip>
              );
            })}
            {sourceCounts.length > 12 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{sourceCounts.length - 12} more
              </span>
            )}
          </FilterRow>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500 pt-1.5 w-[68px] shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1">{children}</div>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  toneClass: string;
  children: React.ReactNode;
}

function FilterChip({ active, onClick, toneClass, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={
        "chip transition-all duration-150 " +
        (active
          ? "border-accent bg-accent text-white shadow-sm ring-2 ring-accent/20"
          : toneClass + " hover:border-slate-300 hover:shadow-sm")
      }
    >
      {children}
    </button>
  );
}

