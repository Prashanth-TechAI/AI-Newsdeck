import { ExternalLink, Sparkles, TrendingUp } from "lucide-react";
import type { Article, Category, Sentiment } from "../types";

const CATEGORY_TONE: Record<Category, string> = {
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

export function pickFeatured(articles: Article[]): Article | null {
  let best: Article | null = null;
  let bestScore = -Infinity;
  for (const a of articles) {
    if (!a.summary) continue;
    const score = a.summary.importance * 1.2 + a.summary.relevance;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  article: Article;
}

export function FeaturedArticle({ article }: Props) {
  const s = article.summary;
  if (!s) return null;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-cardHover mb-7 animate-fadeUp">
      <div className="absolute inset-0 bg-hero-mesh opacity-60 pointer-events-none" />
      <div className="relative grid md:grid-cols-[1.1fr_1fr] gap-0">
        {/* Image / gradient panel */}
        <div className="relative min-h-[220px] md:min-h-[300px] bg-brand-gradient">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white bg-black/30 backdrop-blur border border-white/20 rounded-full px-2.5 py-1">
            <Sparkles size={11} />
            Top story
          </span>
        </div>

        {/* Content */}
        <div className="relative p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className={"chip " + CATEGORY_TONE[s.category]}>
              {s.category}
            </span>
            <span className="chip border-slate-200 bg-slate-50 text-slate-700">
              <span
                className={"w-1.5 h-1.5 rounded-full " + SENTIMENT_DOT[s.sentiment]}
              />
              <span className="capitalize">{s.sentiment}</span>
            </span>
            <span className="chip border-slate-200 bg-slate-50 text-slate-700">
              <TrendingUp size={11} />
              Importance {s.importance}/10
            </span>
          </div>

          <h2 className="mt-4 text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent transition"
            >
              {article.title}
            </a>
          </h2>

          <p className="mt-3 text-[14px] text-slate-700 leading-relaxed line-clamp-4">
            {s.summary}
          </p>

          {s.key_points.length > 0 && (
            <ul className="mt-3 text-[12.5px] text-slate-600 space-y-1 pl-4 list-disc marker:text-accent/60">
              {s.key_points.slice(0, 3).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              <span className="font-medium text-slate-700">
                {article.source}
              </span>
              {article.published_at && (
                <>
                  <span className="mx-1.5 text-slate-300">·</span>
                  {formatDate(article.published_at)}
                </>
              )}
              <span className="mx-1.5 text-slate-300">·</span>
              <span>Keyword: </span>
              <span className="font-medium text-slate-700">
                {article.keyword}
              </span>
            </span>
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient text-white font-semibold px-3.5 py-2 text-xs shadow-glow hover:brightness-110 transition shrink-0"
            >
              Read article
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
