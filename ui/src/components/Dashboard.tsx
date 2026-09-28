import { useMemo } from "react";
import type { Article, LayoutMode } from "../types";
import { ArticleCard } from "./ArticleCard";

interface Props {
  articles: Article[];
  layout: LayoutMode;
}

function dateBucket(iso: string | null): string {
  if (!iso) return "Undated";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Undated";
  const today = new Date();
  const diffMs = today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 animate-fadeUp">
      <div className="flex items-center gap-2.5 py-1">
        <span className="w-1 h-5 rounded-full bg-brand-gradient" />
        <h2 className="text-[13.5px] font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <span className="text-[11px] font-semibold text-accent bg-accent-soft border border-accent-border/70 rounded-full px-2 py-0.5 tabular-nums">
          {count}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent ml-2" />
      </div>
      {children}
    </section>
  );
}

export function Dashboard({ articles, layout }: Props) {
  const grouped = useMemo(() => {
    if (layout === "category") {
      const map: Record<string, Article[]> = {};
      for (const a of articles) {
        const key = a.summary?.category ?? "Other";
        (map[key] ??= []).push(a);
      }
      return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
    }
    if (layout === "source") {
      const map: Record<string, Article[]> = {};
      for (const a of articles) (map[a.source] ??= []).push(a);
      return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
    }
    if (layout === "timeline") {
      const map: Record<string, Article[]> = {};
      const sorted = [...articles].sort((a, b) => {
        const ad = a.published_at ?? "";
        const bd = b.published_at ?? "";
        return bd.localeCompare(ad);
      });
      for (const a of sorted) {
        const key = dateBucket(a.published_at);
        (map[key] ??= []).push(a);
      }
      const orderHint = ["Today", "Yesterday"];
      return Object.entries(map).sort((a, b) => {
        const ai = orderHint.indexOf(a[0]);
        const bi = orderHint.indexOf(b[0]);
        if (ai !== -1 || bi !== -1) {
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        }
        return 0;
      });
    }
    return null;
  }, [articles, layout]);

  if (layout === "grid" || grouped === null) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {articles.map((a, i) => (
          <ArticleCard
            key={a.id}
            article={a}
            style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map(([title, group]) => (
        <Section key={title} title={title} count={group.length}>
          <div
            className={
              layout === "timeline"
                ? "space-y-3"
                : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            }
          >
            {group.map((a, i) => (
              <ArticleCard
                key={a.id}
                article={a}
                compact={layout === "timeline"}
                style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
              />
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
