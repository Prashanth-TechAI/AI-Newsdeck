import { useMemo } from "react";
import {
  BarChart3,
  PieChart as PieIcon,
  Globe2,
  Activity,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsResponse } from "../api/articles";

interface Props {
  analytics: AnalyticsResponse | null;
  loading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
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

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#f43f5e",
};

export function InsightsStrip({ analytics, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 h-[200px] animate-pulse">
            <div className="h-3 w-24 rounded skeleton-shimmer mb-3" />
            <div className="h-32 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }
  if (!analytics || analytics.total === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 animate-fadeUp">
      <CategoryCard analytics={analytics} />
      <SentimentCard analytics={analytics} />
      <TimelineCard analytics={analytics} />
      <SourcesCard analytics={analytics} />
    </div>
  );
}

function ChartCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-premium p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent grid place-items-center shrink-0">
          <Icon size={14} />
        </span>
        <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
      </div>
      {subtitle && (
        <p className="text-[11px] text-slate-500 mb-3 ml-9">{subtitle}</p>
      )}
      <div className="flex-1 min-h-[140px] mt-2">{children}</div>
    </div>
  );
}

function CategoryCard({ analytics }: { analytics: AnalyticsResponse }) {
  const data = useMemo(
    () => analytics.by_category.slice(0, 8),
    [analytics],
  );
  if (data.length === 0) {
    return (
      <ChartCard icon={PieIcon} title="By category">
        <Empty />
      </ChartCard>
    );
  }
  return (
    <ChartCard icon={PieIcon} title="By category" subtitle={`${analytics.total} articles`}>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={36}
            outerRadius={62}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell
                key={d.label}
                fill={CATEGORY_COLORS[d.label] ?? "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip content={<MiniTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <Legend
        items={data.slice(0, 4).map((d) => ({
          label: d.label,
          color: CATEGORY_COLORS[d.label] ?? "#94a3b8",
          value: d.count,
        }))}
      />
    </ChartCard>
  );
}

function SentimentCard({ analytics }: { analytics: AnalyticsResponse }) {
  const data = useMemo(() => analytics.by_sentiment, [analytics]);
  if (data.length === 0) {
    return (
      <ChartCard icon={Activity} title="Sentiment">
        <Empty />
      </ChartCard>
    );
  }
  return (
    <ChartCard icon={Activity} title="Sentiment" subtitle="Tone of coverage">
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={36}
            outerRadius={62}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={SENTIMENT_COLORS[d.label] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip content={<MiniTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <Legend
        items={data.map((d) => ({
          label: d.label,
          color: SENTIMENT_COLORS[d.label] ?? "#94a3b8",
          value: d.count,
        }))}
      />
    </ChartCard>
  );
}

function TimelineCard({ analytics }: { analytics: AnalyticsResponse }) {
  const data = useMemo(() => {
    return analytics.timeline.map((p) => ({
      ...p,
      shortDate: shortDate(p.date),
    }));
  }, [analytics]);

  if (data.length === 0) {
    return (
      <ChartCard icon={BarChart3} title="Timeline">
        <Empty />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      icon={BarChart3}
      title="Timeline"
      subtitle={`Daily volume · last ${analytics.window_days} days`}
    >
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
        >
          <XAxis
            dataKey="shortDate"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<MiniTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
          <Bar dataKey="count" fill="url(#timelineGrad)" radius={[4, 4, 0, 0]} />
          <defs>
            <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.65} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function SourcesCard({ analytics }: { analytics: AnalyticsResponse }) {
  const data = useMemo(() => analytics.by_source.slice(0, 6), [analytics]);
  if (data.length === 0) {
    return (
      <ChartCard icon={Globe2} title="Top sources">
        <Empty />
      </ChartCard>
    );
  }
  const max = Math.max(...data.map((d) => d.count));
  return (
    <ChartCard icon={Globe2} title="Top sources" subtitle="Most-cited outlets">
      <ul className="space-y-2 text-[12.5px] mt-1">
        {data.map((d) => {
          const pct = max > 0 ? (d.count / max) * 100 : 0;
          return (
            <li key={d.label} className="flex items-center gap-2">
              <span className="flex-1 truncate text-slate-700">{d.label}</span>
              <span className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <span
                  className="h-full bg-brand-gradient rounded-full block"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="text-[11px] tabular-nums text-slate-500 w-7 text-right">
                {d.count}
              </span>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

function Legend({
  items,
}: {
  items: { label: string; color: string; value: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: i.color }}
          />
          <span className="capitalize">{i.label}</span>
          <span className="tabular-nums text-slate-400">{i.value}</span>
        </span>
      ))}
    </div>
  );
}

function MiniTooltip({ active, payload }: any) {
  if (!active || !payload || !payload[0]) return null;
  const item = payload[0];
  return (
    <div className="rounded-md bg-white border border-slate-200 shadow-cardHover px-2.5 py-1.5 text-[11px]">
      <span className="font-semibold text-slate-900 capitalize">
        {item.payload.label || item.payload.shortDate || item.payload.date}
      </span>
      <span className="ml-2 tabular-nums text-slate-600">{item.value}</span>
    </div>
  );
}

function Empty() {
  return (
    <div className="h-full grid place-items-center text-xs text-slate-400">
      No data yet
    </div>
  );
}

function shortDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
