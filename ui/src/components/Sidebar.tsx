import { useEffect, useState, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  X,
  Play,
  Loader2,
  LayoutGrid,
  Layers,
  Clock,
  Globe2,
  Sparkles,
  Newspaper,
  Settings,
} from "lucide-react";
import type { DashboardConfig, LayoutMode } from "../types";
import { listKeywords } from "../api/keywords";

interface Props {
  config: DashboardConfig;
  onChange: (cfg: DashboardConfig) => void;
  onRun: () => void;
  loading: boolean;
}

const LAYOUTS: { id: LayoutMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "category", label: "Category", icon: Layers },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "source", label: "Source", icon: Globe2 },
];

export function Sidebar({ config, onChange, onRun, loading }: Props) {
  const [draft, setDraft] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Load saved keywords from the DB on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSyncing(true);
        const items = await listKeywords(false);
        if (cancelled) return;
        const texts = items.map((k) => k.text);
        if (texts.length > 0 && config.keywords.length === 0) {
          onChange({ ...config, keywords: texts.slice(0, 10) });
        }
      } catch {
        // silent: stay with in-memory list
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addKeyword = (v?: string) => {
    const value = (v ?? draft).trim();
    if (!value) return;
    if (config.keywords.includes(value)) return;
    if (config.keywords.length >= 10) return;
    onChange({ ...config, keywords: [...config.keywords, value] });
    setDraft("");
  };

  const removeKeyword = (k: string) => {
    onChange({ ...config, keywords: config.keywords.filter((x) => x !== k) });
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    }
  };

  const canRun = config.keywords.length > 0 && !loading;

  return (
    <aside className="w-[340px] shrink-0 border-r border-slate-200/80 bg-sidebar-grad flex flex-col relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="px-6 py-5 border-b border-slate-200/70 flex items-center gap-3 relative">
        <div className="relative shrink-0">
          <div className="absolute -inset-1 rounded-2xl bg-brand-gradient opacity-30 blur-md animate-pulseGlow" />
          <div className="relative w-10 h-10 rounded-xl bg-brand-gradient text-white flex items-center justify-center shadow-glow">
            <Newspaper size={19} />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-[15.5px] font-extrabold tracking-tight leading-none">
            AI <span className="brand-text">Newsdeck</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Intelligent dashboard
          </p>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-6 overflow-y-auto flex-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="label">Topics to track</label>
            <Link
              to="/app/keywords"
              className="text-[10.5px] font-semibold text-accent hover:text-accent-hover inline-flex items-center gap-1"
              title="Manage saved keywords"
            >
              <Settings size={11} />
              Manage
            </Link>
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder={syncing ? "Loading saved…" : "Add a keyword…"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              disabled={loading || syncing}
            />
            <button
              className="shrink-0 grid place-items-center w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition disabled:opacity-50"
              onClick={() => addKeyword()}
              disabled={!draft.trim() || loading}
              title="Add keyword"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
            {config.keywords.length === 0 && (
              <span className="text-xs text-slate-400">
                Press <kbd className="kbd">Enter</kbd> to add. Max 10.
              </span>
            )}
            {config.keywords.map((k) => (
              <span
                key={k}
                className="chip border-accent-border/70 bg-accent-soft text-accent font-medium animate-scaleIn transition-all hover:shadow-sm"
              >
                {k}
                <button
                  onClick={() => removeKeyword(k)}
                  className="-mr-0.5 text-accent/60 hover:text-accent transition"
                  disabled={loading}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SliderField
            label="Articles / keyword"
            value={config.maxPerKeyword}
            min={3}
            max={15}
            onChange={(v) => onChange({ ...config, maxPerKeyword: v })}
            disabled={loading}
          />
          <SliderField
            label="Days back"
            value={config.daysBack}
            min={1}
            max={14}
            onChange={(v) => onChange({ ...config, daysBack: v })}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">Search depth</label>
          <div className="grid grid-cols-2 gap-2">
            {(["basic", "advanced"] as const).map((d) => (
              <button
                key={d}
                onClick={() => onChange({ ...config, searchDepth: d })}
                disabled={loading}
                className={
                  "seg-btn capitalize py-2.5 " +
                  (config.searchDepth === d ? "seg-btn-active" : "seg-btn-idle")
                }
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Advanced returns longer article bodies; basic is faster.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">Dashboard layout</label>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUTS.map(({ id, label, icon: Icon }) => {
              const active = config.layout === id;
              return (
                <button
                  key={id}
                  onClick={() => onChange({ ...config, layout: id })}
                  disabled={loading}
                  className={
                    "seg-btn flex flex-col items-start gap-1.5 py-3 px-3 " +
                    (active ? "seg-btn-active" : "seg-btn-idle")
                  }
                >
                  <Icon size={15} className={active ? "text-accent" : ""} />
                  <span className="text-[11.5px]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 border-t border-slate-200/70 bg-white/40 backdrop-blur">
        <button className="btn-brand w-full" onClick={onRun} disabled={!canRun}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Fetching & summarizing…
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" />
              Run agent
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-500 mt-2.5 text-center inline-flex items-center justify-center gap-1.5 w-full">
          <Sparkles size={11} className="text-accent" />
          Live search · AI summarization
        </p>
      </div>
    </aside>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label className="label">{label}</label>
        <span className="text-sm font-bold text-slate-900 tabular-nums">
          {value}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
