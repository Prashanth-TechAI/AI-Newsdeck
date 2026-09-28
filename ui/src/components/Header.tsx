import { useMemo, useRef, useState, useEffect } from "react";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Globe2,
  ChevronDown,
  LogOut,
  Shield,
  Mail,
  Zap,
  History,
} from "lucide-react";
import type { FetchResponse } from "../types";
import { useAuth } from "../auth/AuthContext";
import { SchedulerBadge } from "./SchedulerBadge";

type ViewMode = "run" | "history";

interface Props {
  result: FetchResponse | null;
  loading: boolean;
  viewMode: ViewMode;
  onChangeView: (m: ViewMode) => void;
  hasRun: boolean;
  hasHistory: boolean;
}

export function Header({
  result,
  loading,
  viewMode,
  onChangeView,
  hasRun,
  hasHistory,
}: Props) {
  const showToggle = hasRun && hasHistory;
  const categoryCount = useMemo(() => {
    if (!result) return 0;
    const set = new Set<string>();
    for (const a of result.articles) {
      if (a.summary) set.add(a.summary.category);
    }
    return set.size;
  }, [result]);

  const sourceCount = useMemo(() => {
    if (!result) return 0;
    return new Set(result.articles.map((a) => a.source)).size;
  }, [result]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="px-8 py-4 flex items-center gap-3 flex-wrap">
        <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-baseline gap-2">
          {result ? (
            <>
              <span className="brand-text">{result.total_articles}</span>
              <span className="font-medium text-slate-500">
                {result.total_articles === 1 ? "article" : "articles"}
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wide">
                {viewMode === "run" ? "from this run" : "across all history"}
              </span>
            </>
          ) : loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Running the agent…
            </span>
          ) : (
            "Dashboard"
          )}
        </h2>

        {result && (
          <div className="flex items-center gap-2 ml-2 flex-wrap">
            <span className="stat-pill">
              <Clock size={11} className="text-slate-400" />
              <span className="stat-pill-num">{result.elapsed_seconds}s</span>
              <span className="text-slate-500">runtime</span>
            </span>
            <span className="stat-pill">
              <Layers size={11} className="text-slate-400" />
              <span className="stat-pill-num">{categoryCount}</span>
              <span className="text-slate-500">categories</span>
            </span>
            <span className="stat-pill">
              <Globe2 size={11} className="text-slate-400" />
              <span className="stat-pill-num">{sourceCount}</span>
              <span className="text-slate-500">sources</span>
            </span>
            {result.stats?.summarized_ok !== undefined && (
              <span className="stat-pill">
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span className="stat-pill-num">
                  {result.stats.summarized_ok}
                </span>
                <span className="text-slate-500">summarized</span>
              </span>
            )}
            {!!result.stats?.filtered_off_topic && (
              <span className="stat-pill">
                <AlertCircle size={11} className="text-amber-500" />
                <span className="stat-pill-num">
                  {result.stats.filtered_off_topic}
                </span>
                <span className="text-slate-500">filtered</span>
              </span>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {showToggle && (
            <ViewToggle value={viewMode} onChange={onChangeView} />
          )}
          <SchedulerBadge />
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold tracking-tight text-accent bg-accent-soft border border-accent-border/70 rounded-full px-3 py-1.5 shadow-soft">
            <Sparkles size={12} className="text-accent" />
            AI-powered
          </span>
          <UserMenu />
        </div>
      </div>

      {result && result.keywords.length > 0 && (
        <div className="px-8 pb-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
            Keywords
          </span>
          <span className="text-slate-300">·</span>
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.map((k) => (
              <span
                key={k}
                className="chip border-slate-200 bg-slate-50 text-slate-700"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  const opts: { id: ViewMode; label: string; icon: typeof Zap }[] = [
    { id: "run", label: "This run", icon: Zap },
    { id: "history", label: "All history", icon: History },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white/90 backdrop-blur p-0.5 shadow-soft">
      {opts.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold tracking-tight transition-all duration-200 " +
              (active
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")
            }
            title={
              id === "run"
                ? "Show only articles from your latest fetch"
                : "Show every article ever collected"
            }
          >
            <Icon size={11} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function UserMenu() {
  const { user, signout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;
  const initial = (user.name?.[0] || user.email[0] || "?").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((x) => !x)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 backdrop-blur pl-1 pr-2.5 py-1 hover:border-accent/40 hover:shadow-soft transition-all duration-200"
      >
        <span className="w-7 h-7 rounded-full bg-brand-gradient text-white grid place-items-center text-xs font-bold">
          {initial}
        </span>
        <span className="text-sm font-medium text-slate-800 max-w-[140px] truncate hidden sm:inline">
          {user.name || user.email}
        </span>
        <ChevronDown size={13} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 card p-0 overflow-hidden z-30 animate-fadeUp">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Mail size={11} /> {user.email}
            </p>
            {user.is_admin && (
              <span className="chip mt-2 border-violet-200 bg-violet-50 text-violet-700 text-[10.5px]">
                <Shield size={10} /> Admin
              </span>
            )}
          </div>
          <button
            onClick={signout}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <LogOut size={14} className="text-slate-500" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
