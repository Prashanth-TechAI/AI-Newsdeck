import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  PieChart as PieIcon,
  Smile,
  CalendarRange,
} from "lucide-react";
import type { Article, Category, Sentiment } from "../types";

const CATEGORY_COLOR: Record<Category, string> = {
  Business: "#f59e0b",
  Technology: "#6366f1",
  Politics: "#f43f5e",
  Sports: "#10b981",
  Entertainment: "#ec4899",
  Science: "#06b6d4",
  World: "#0ea5e9",
  Health: "#84cc16",
  Finance: "#eab308",
  Other: "#94a3b8",
};

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#f43f5e",
};

interface Props {
  articles: Article[];
}

export function Analytics({ articles }: Props) {
  const { categories, sentiments, timeline, totalSummarized } = useMemo(() => {
    const cat: Record<string, number> = {};
    const sent: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };
    const day: Record<string, number> = {};

    let summarized = 0;

    for (const a of articles) {
      if (a.summary) {
        summarized++;
        cat[a.summary.category] = (cat[a.summary.category] ?? 0) + 1;
        sent[a.summary.sentiment] = (sent[a.summary.sentiment] ?? 0) + 1;
      }
      if (a.published_at) {
        const d = new Date(a.published_at);
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10);
          day[key] = (day[key] ?? 0) + 1;
        }
      }
    }

    const categories = Object.entries(cat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const sentiments = (["positive", "neutral", "negative"] as Sentiment[])
      .map((name) => ({ name, value: sent[name] ?? 0 }))
      .filter((d) => d.value > 0);

    const last14 = buildLastNDays(14);
    const timeline = last14.map((iso) => ({
      date: iso,
      label: new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count: day[iso] ?? 0,
    }));

    return { categories, sentiments, timeline, totalSummarized: summarized };
  }, [articles]);

  if (totalSummarized === 0 && timeline.every((d) => d.count === 0)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
      <div className="animate-fadeUp">
        <ChartCard
          icon={<PieIcon size={14} />}
          title="Categories"
          subtitle={`${categories.length} active`}
        >
          {categories.length === 0 ? (
            <EmptyChart label="No categorized articles yet" />
          ) : (
            <DonutChart
              data={categories}
              colorFor={(name) =>
                CATEGORY_COLOR[name as Category] ?? CATEGORY_COLOR.Other
              }
              totalLabel="Articles"
            />
          )}
        </ChartCard>
      </div>

      <div className="animate-fadeUp" style={{ animationDelay: "80ms" }}>
        <ChartCard
          icon={<Smile size={14} />}
          title="Sentiment"
          subtitle={`${totalSummarized} analyzed`}
        >
          {sentiments.length === 0 ? (
            <EmptyChart label="No sentiment data yet" />
          ) : (
            <DonutChart
              data={sentiments}
              colorFor={(name) =>
                SENTIMENT_COLOR[name as Sentiment] ?? SENTIMENT_COLOR.neutral
              }
              totalLabel="Articles"
              capitalize
            />
          )}
        </ChartCard>
      </div>

      <div className="animate-fadeUp lg:col-span-1" style={{ animationDelay: "160ms" }}>
        <ChartCard
          icon={<CalendarRange size={14} />}
          title="Timeline"
          subtitle="Last 14 days"
        >
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeline}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "rgba(79,70,229,0.06)" }}
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
                }}
                labelStyle={{ color: "#334155", fontWeight: 600 }}
                formatter={(v) => [Number(v ?? 0), "articles"] as [number, string]}
              />
              <Bar
                dataKey="count"
                fill="url(#barGrad)"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-premium p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-brand-gradient opacity-70" />
      <div className="flex items-center gap-2.5 mb-4">
        <span className="relative w-8 h-8 rounded-xl bg-accent-soft text-accent grid place-items-center shadow-soft">
          {icon}
        </span>
        <div className="leading-tight">
          <h3 className="text-[13.5px] font-semibold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[180px] grid place-items-center text-xs text-slate-400">
      {label}
    </div>
  );
}

interface DonutProps {
  data: { name: string; value: number }[];
  colorFor: (name: string) => string;
  totalLabel: string;
  capitalize?: boolean;
}

function DonutChart({ data, colorFor, totalLabel, capitalize }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[140px] h-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={62}
              stroke="#fff"
              strokeWidth={2}
              paddingAngle={2}
              isAnimationActive
            >
              {data.map((d) => (
                <Cell key={d.name} fill={colorFor(d.name)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              }}
              formatter={(v, _n, item: any) => {
                const n = Number(v ?? 0);
                const label = String(item?.name ?? "");
                const pretty = capitalize
                  ? label.charAt(0).toUpperCase() + label.slice(1)
                  : label;
                return [
                  `${n} (${total === 0 ? 0 : ((n / total) * 100).toFixed(0)}%)`,
                  pretty,
                ] as [string, string];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center leading-none">
            <div className="text-xl font-extrabold tabular-nums text-slate-900">
              {total}
            </div>
            <div className="text-[9.5px] uppercase tracking-wider text-slate-500 mt-1">
              {totalLabel}
            </div>
          </div>
        </div>
      </div>

      <ul className="flex-1 min-w-0 space-y-1.5 max-h-[140px] overflow-y-auto">
        {data.map((d) => {
          const pct = total === 0 ? 0 : Math.round((d.value / total) * 100);
          return (
            <li
              key={d.name}
              className="flex items-center gap-2 text-[12px] leading-tight"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: colorFor(d.name) }}
              />
              <span
                className={
                  "truncate text-slate-700 font-medium " +
                  (capitalize ? "capitalize" : "")
                }
              >
                {d.name}
              </span>
              <span className="ml-auto text-slate-500 tabular-nums">
                {d.value}
                <span className="text-slate-300 mx-1">·</span>
                <span className="text-slate-400">{pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function buildLastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
