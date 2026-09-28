import {
  Search,
  Brain,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface Props {
  onAddKeyword: (k: string) => void;
}

const TRENDING: { label: string; tag: string }[] = [
  { label: "Artificial intelligence", tag: "Tech" },
  { label: "Climate policy", tag: "World" },
  { label: "Stock market", tag: "Finance" },
  { label: "Electric vehicles", tag: "Business" },
  { label: "Space exploration", tag: "Science" },
  { label: "Cybersecurity", tag: "Tech" },
  { label: "Healthcare reform", tag: "Health" },
  { label: "Cricket world cup", tag: "Sports" },
];

const STEPS = [
  {
    icon: Search,
    title: "Fetch",
    body: "We pull fresh articles from trusted news sources for every keyword you track.",
  },
  {
    icon: Brain,
    title: "Summarize",
    body: "AI distills each article into a category, sentiment, and a 10-second summary.",
  },
  {
    icon: LayoutDashboard,
    title: "Organize",
    body: "Group by category, timeline, or source. Rank by importance & relevance.",
  },
];

export function EmptyState({ onAddKeyword }: Props) {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 bg-hero-mesh pointer-events-none" />

      <div className="max-w-5xl mx-auto pt-12 pb-16 px-2 animate-fadeUp">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent bg-accent-soft border border-accent-border rounded-full px-3 py-1">
            <Sparkles size={11} />
            AI news agent
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Monitor the news{" "}
            <span className="brand-text">that moves your business</span>.
          </h1>
          <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">
            Add any topics in the sidebar, pick a layout, and run the agent.
            We&apos;ll pull recent articles, summarize them with AI, and
            organize them onto a dashboard you control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="card p-5 flex flex-col gap-3 relative overflow-hidden animate-fadeUp"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-9 h-9 rounded-lg bg-accent-soft text-accent grid place-items-center">
                <Icon size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                </div>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {body}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight
                  size={14}
                  className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-300"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-14">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-slate-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Try a trending topic
            </h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map(({ label, tag }) => (
              <button
                key={label}
                onClick={() => onAddKeyword(label)}
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white hover:border-accent hover:bg-accent-soft transition px-3.5 py-2"
              >
                <span className="text-sm font-medium text-slate-800 group-hover:text-accent">
                  {label}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-l border-slate-200 pl-2 group-hover:border-accent-border group-hover:text-accent/80">
                  {tag}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Click any topic to add it to your dashboard, then hit{" "}
            <span className="font-semibold text-slate-700">Run agent</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
