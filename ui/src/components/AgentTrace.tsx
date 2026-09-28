import { useMemo, useState } from "react";
import {
  Brain,
  ChevronDown,
  Search,
  Scale,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { AgentTraceEvent } from "../types";

interface Props {
  trace: AgentTraceEvent[];
  keywords: string[];
}

const INTENT_BADGE: Record<string, string> = {
  news: "bg-sky-50 text-sky-700 border-sky-200",
  research: "bg-violet-50 text-violet-700 border-violet-200",
  entity: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const DECISION_COLORS: Record<string, string> = {
  proceed: "text-emerald-700 bg-emerald-50 border-emerald-200",
  retry: "text-amber-700 bg-amber-50 border-amber-200",
  give_up: "text-rose-700 bg-rose-50 border-rose-200",
};

export function AgentTrace({ trace, keywords }: Props) {
  const [open, setOpen] = useState(false);

  const byKeyword = useMemo(() => {
    const m: Record<string, AgentTraceEvent[]> = {};
    for (const k of keywords) m[k] = [];
    for (const e of trace) {
      if (!e.keyword) continue;
      (m[e.keyword] ??= []).push(e);
    }
    return m;
  }, [trace, keywords]);

  const summary = useMemo(() => {
    const intents = new Set<string>();
    let retries = 0;
    let searches = 0;
    for (const e of trace) {
      if (e.stage === "plan" && e.detail.intent) intents.add(e.detail.intent);
      if (e.stage === "search") searches++;
      if (e.stage === "evaluate" && e.detail.decision === "retry") retries++;
    }
    return { intents: [...intents], retries, searches };
  }, [trace]);

  if (!trace.length) return null;

  return (
    <div className="card mb-6 overflow-hidden animate-fadeUp">
      <button
        onClick={() => setOpen((x) => !x)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition"
      >
        <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white grid place-items-center shrink-0 shadow-sm">
          <Brain size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">
              Agent reasoning
            </span>
            {summary.intents.map((i) => (
              <span
                key={i}
                className={
                  "chip text-[10.5px] " + (INTENT_BADGE[i] || INTENT_BADGE.news)
                }
              >
                {i}
              </span>
            ))}
            <span className="text-xs text-slate-500">
              {summary.searches} search{summary.searches === 1 ? "" : "es"}
              {summary.retries > 0 && (
                <>
                  <span className="mx-1 text-slate-300">·</span>
                  <span className="text-amber-600 font-medium">
                    {summary.retries} retry
                  </span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            How the agent planned and judged the search
          </p>
        </div>
        <ChevronDown
          size={16}
          className={
            "text-slate-400 shrink-0 transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open && (
        <div className="border-t border-slate-200 divide-y divide-slate-100">
          {keywords.map((kw) => {
            const events = byKeyword[kw] || [];
            if (events.length === 0) return null;
            return (
              <div key={kw} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Keyword
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 bg-slate-100 rounded px-2 py-0.5">
                    {kw}
                  </span>
                </div>
                <ol className="space-y-2.5">
                  {events.map((e, i) => (
                    <EventRow key={i} event={e} index={i + 1} />
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventRow({ event, index }: { event: AgentTraceEvent; index: number }) {
  const { stage, detail } = event;

  let icon = <Search size={13} />;
  let title: string = stage;
  let body: React.ReactNode = null;
  let tone = "text-slate-600";

  if (stage === "plan") {
    icon = <Brain size={13} />;
    title = "Plan";
    tone = "text-violet-700";
    body = (
      <div className="space-y-1">
        <p className="text-sm text-slate-700">{detail.reasoning}</p>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span
            className={
              "chip " + (INTENT_BADGE[detail.intent] || INTENT_BADGE.news)
            }
          >
            {detail.intent}
          </span>
          <span className="chip border-slate-200 bg-slate-50 text-slate-700">
            topic: {detail.topic}
          </span>
          <span className="chip border-slate-200 bg-slate-50 text-slate-700">
            days: {detail.days_back}
          </span>
          <span className="chip border-slate-200 bg-slate-50 text-slate-700">
            depth: {detail.search_depth}
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Queries:{" "}
          {(detail.queries || []).map((q: string, i: number) => (
            <span key={i}>
              <code className="font-mono text-slate-700 bg-slate-100 rounded px-1.5 py-0.5">
                {q}
              </code>
              {i < (detail.queries || []).length - 1 && " · "}
            </span>
          ))}
        </div>
      </div>
    );
  } else if (stage === "search") {
    icon = <Search size={13} />;
    title = "Search";
    tone = "text-sky-700";
    body = (
      <div className="text-xs text-slate-600">
        <code className="font-mono text-slate-700 bg-slate-100 rounded px-1.5 py-0.5">
          {detail.query}
        </code>{" "}
        → <span className="font-semibold text-slate-900">{detail.found}</span>{" "}
        result{detail.found === 1 ? "" : "s"}
        {detail.duplicates > 0 && (
          <span className="text-slate-500">
            {" "}
            ({detail.duplicates} dup
            {detail.duplicates === 1 ? "" : "s"})
          </span>
        )}
      </div>
    );
  } else if (stage === "evaluate") {
    icon =
      detail.decision === "proceed" ? (
        <CheckCircle2 size={13} />
      ) : detail.decision === "retry" ? (
        <RefreshCw size={13} />
      ) : (
        <XCircle size={13} />
      );
    title = `Evaluate · ${detail.decision}`;
    tone =
      detail.decision === "proceed"
        ? "text-emerald-700"
        : detail.decision === "retry"
          ? "text-amber-700"
          : "text-rose-700";
    body = (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span
            className={
              "chip " + (DECISION_COLORS[detail.decision] || DECISION_COLORS.proceed)
            }
          >
            {detail.decision}
          </span>
          <span className="text-slate-500">
            on-topic:{" "}
            <span className="text-slate-900 font-semibold">
              {detail.on_topic}
            </span>
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">
            off-topic:{" "}
            <span className="text-slate-900 font-semibold">
              {detail.off_topic}
            </span>
          </span>
        </div>
        <p className="text-sm text-slate-700">{detail.reasoning}</p>
        {detail.new_queries?.length > 0 && (
          <div className="text-xs text-slate-500">
            Retrying with:{" "}
            {detail.new_queries.map((q: string, i: number) => (
              <span key={i}>
                <code className="font-mono text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  {q}
                </code>
                {i < detail.new_queries.length - 1 && " · "}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <li className="flex items-start gap-3">
      <span className="text-[10px] font-bold tracking-widest text-slate-400 mt-1 tabular-nums w-5 text-right">
        {String(index).padStart(2, "0")}
      </span>
      <div
        className={
          "w-6 h-6 rounded-md bg-slate-100 grid place-items-center shrink-0 " +
          tone
        }
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={"text-xs font-semibold uppercase tracking-wider " + tone}>
            {title}
          </span>
          <Scale size={0} className="hidden" />
        </div>
        <div className="mt-1">{body}</div>
      </div>
    </li>
  );
}
