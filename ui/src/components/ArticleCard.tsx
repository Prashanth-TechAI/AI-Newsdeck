import {
  ExternalLink,
  AlertCircle,
  TrendingUp,
  Briefcase,
  Cpu,
  Landmark,
  Trophy,
  Film,
  FlaskConical,
  Globe2,
  HeartPulse,
  DollarSign,
  Newspaper,
} from "lucide-react";
import type { Article, Category, Sentiment } from "../types";

const CATEGORY_COLORS: Record<Category, string> = {
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

const CATEGORY_PLACEHOLDER: Record<Category, { grad: string; icon: any }> = {
  Business:       { grad: "from-amber-400/30 to-orange-300/30",       icon: Briefcase },
  Technology:     { grad: "from-indigo-400/35 to-violet-300/30",      icon: Cpu },
  Politics:       { grad: "from-rose-400/30 to-fuchsia-300/30",       icon: Landmark },
  Sports:         { grad: "from-emerald-400/30 to-teal-300/30",       icon: Trophy },
  Entertainment:  { grad: "from-pink-400/35 to-rose-300/30",          icon: Film },
  Science:        { grad: "from-cyan-400/30 to-sky-300/30",           icon: FlaskConical },
  World:          { grad: "from-sky-400/30 to-blue-300/30",           icon: Globe2 },
  Health:         { grad: "from-lime-400/30 to-emerald-300/30",       icon: HeartPulse },
  Finance:        { grad: "from-yellow-400/30 to-amber-300/30",       icon: DollarSign },
  Other:          { grad: "from-slate-400/20 to-slate-300/20",        icon: Newspaper },
};

const SENTIMENT_DOT: Record<Sentiment, string> = {
  positive: "bg-emerald-500",
  neutral: "bg-slate-400",
  negative: "bg-rose-500",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

interface Props {
  article: Article;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function ArticleCard({ article, compact = false, style }: Props) {
  const s = article.summary;

  return (
    <article
      className="card-premium p-4 flex flex-col gap-3 animate-fadeUp group"
      style={style}
    >
      {!compact && (article.image_url ? (
        <div className="relative aspect-[16/9] -mx-4 -mt-4 mb-1 overflow-hidden rounded-t-2xl bg-slate-100 border-b border-slate-200/60">
          <img
            src={article.image_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent pointer-events-none" />
          {s && (
            <span
              className={
                "absolute top-3 left-3 chip backdrop-blur-md bg-white/85 " +
                CATEGORY_COLORS[s.category]
              }
            >
              {s.category}
            </span>
          )}
        </div>
      ) : (
        <CategoryPlaceholder category={s?.category ?? "Other"} />
      ))}

      <div className="flex items-center gap-2 flex-wrap text-xs">
        {s && (!article.image_url || compact) && (
          <span className={"chip " + CATEGORY_COLORS[s.category]}>
            {s.category}
          </span>
        )}
        {s && (
          <span
            className="chip border-slate-200 bg-slate-50 text-slate-700"
            title={`Sentiment: ${s.sentiment}`}
          >
            <span
              className={"w-1.5 h-1.5 rounded-full " + SENTIMENT_DOT[s.sentiment]}
            />
            {s.sentiment}
          </span>
        )}
        {s && (
          <span
            className="chip border-slate-200 bg-slate-50 text-slate-700"
            title="Importance score"
          >
            <TrendingUp size={11} />
            {s.importance}/10
          </span>
        )}
        <span className="ml-auto text-slate-500">
          {article.source}
          {article.published_at && (
            <>
              <span className="mx-1.5 text-slate-300">·</span>
              {formatDate(article.published_at)}
            </>
          )}
        </span>
      </div>

      <h3 className="font-semibold text-slate-900 leading-snug">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent"
        >
          {article.title}
        </a>
      </h3>

      {article.error && (
        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>
            Couldn’t summarize this article — showing snippet instead.
            <span className="block text-slate-600 mt-1">
              {article.raw_snippet}
            </span>
          </span>
        </div>
      )}

      {s && (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">{s.summary}</p>
          {s.key_points.length > 0 && !compact && (
            <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc marker:text-slate-400">
              {s.key_points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
          {s.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100 text-xs">
        <span className="text-slate-500">
          Keyword:{" "}
          <span className="text-slate-700 font-medium">{article.keyword}</span>
        </span>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:text-accent-hover inline-flex items-center gap-1 font-medium"
        >
          Read article <ExternalLink size={12} />
        </a>
      </div>
    </article>
  );
}

function CategoryPlaceholder({ category }: { category: Category }) {
  const { grad, icon: Icon } = CATEGORY_PLACEHOLDER[category];
  return (
    <div
      className={
        "relative aspect-[16/9] -mx-4 -mt-4 mb-1 overflow-hidden rounded-t-2xl border-b border-slate-200/60 bg-gradient-to-br " +
        grad
      }
    >
      {/* subtle dotted overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.18) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-slate-700/60">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <span
        className={
          "absolute top-3 left-3 chip backdrop-blur-md bg-white/85 " +
          CATEGORY_COLORS[category]
        }
      >
        {category}
      </span>
    </div>
  );
}
