import { useEffect, useState } from "react";
import { Activity, Loader2, Play, RefreshCw } from "lucide-react";
import {
  getSchedulerStatus,
  runSchedulerNow,
  type SchedulerStatus,
} from "../api/articles";
import { useAuth } from "../auth/AuthContext";

interface Props {
  onAfterRun?: () => void;
}

export function SchedulerBadge({ onAfterRun }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [running, setRunning] = useState(false);

  const reload = async () => {
    try {
      setStatus(await getSchedulerStatus());
    } catch {
      /* */
    }
  };

  useEffect(() => {
    reload();
    const id = setInterval(reload, 15000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  const dotColor = status.in_flight
    ? "bg-amber-500 animate-pulse"
    : status.enabled
      ? "bg-emerald-500"
      : "bg-slate-400";

  const onRunNow = async () => {
    if (!user?.is_admin) return;
    setRunning(true);
    try {
      await runSchedulerNow();
      // Give it a moment, then refresh
      setTimeout(() => {
        reload();
        onAfterRun?.();
      }, 1500);
    } catch {
      /* */
    } finally {
      setRunning(false);
    }
  };

  const nextRunLabel = formatRelative(status.next_run_at);
  const lastRun = status.last_run;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white pl-2 pr-2.5 py-1 text-xs"
        title={
          status.in_flight
            ? "A scheduler run is in progress…"
            : status.enabled
              ? `Auto-fetch every ${status.interval_minutes} min`
              : "Scheduler disabled"
        }
      >
        <span className={"w-1.5 h-1.5 rounded-full " + dotColor} />
        <span className="font-medium text-slate-700">
          {status.in_flight
            ? "Fetching…"
            : status.enabled
              ? `next: ${nextRunLabel}`
              : "Auto-fetch off"}
        </span>
        {lastRun && lastRun.status === "success" && (
          <span className="text-slate-400">
            · {lastRun.articles_persisted ?? 0} last
          </span>
        )}
      </div>

      {user?.is_admin && (
        <button
          onClick={onRunNow}
          disabled={running || status.in_flight}
          className="btn-ghost text-xs"
          title="Run scheduler now (admin)"
        >
          {running ? (
            <Loader2 size={12} className="animate-spin" />
          ) : status.in_flight ? (
            <RefreshCw size={12} />
          ) : (
            <Play size={12} fill="currentColor" />
          )}
        </button>
      )}
    </div>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const target = new Date(iso).getTime();
  const diff = Math.round((target - Date.now()) / 60000);
  if (diff <= 0) return "now";
  if (diff < 60) return `${diff}m`;
  const h = Math.round(diff / 60);
  return `${h}h`;
}
