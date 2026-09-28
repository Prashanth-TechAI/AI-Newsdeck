import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  Loader2,
  Power,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Tag,
} from "lucide-react";
import {
  createKeyword,
  deleteKeyword,
  Keyword,
  listKeywords,
  updateKeyword,
} from "../api/keywords";
import { useAuth } from "../auth/AuthContext";

export function KeywordsAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const list = await listKeywords(true);
      setItems(list);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load keywords");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setSubmitting(true);
    setError(null);
    try {
      await createKeyword(t);
      setDraft("");
      await reload();
    } catch (e: any) {
      setError(e?.message || "Could not add keyword.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (kw: Keyword) => {
    setEditingId(kw.id);
    setEditText(kw.text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (id: number) => {
    const t = editText.trim();
    if (!t) return;
    setPendingId(id);
    try {
      await updateKeyword(id, { text: t });
      cancelEdit();
      await reload();
    } catch (e: any) {
      setError(e?.message || "Could not update keyword.");
    } finally {
      setPendingId(null);
    }
  };

  const toggleActive = async (kw: Keyword) => {
    setPendingId(kw.id);
    try {
      await updateKeyword(kw.id, { is_active: !kw.is_active });
      await reload();
    } catch (e: any) {
      setError(e?.message || "Could not toggle keyword.");
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this keyword permanently?")) return;
    setPendingId(id);
    try {
      await deleteKeyword(id);
      await reload();
    } catch (e: any) {
      setError(e?.message || "Could not delete keyword.");
    } finally {
      setPendingId(null);
    }
  };

  const active = items.filter((k) => k.is_active);
  const inactive = items.filter((k) => !k.is_active);
  const isAdmin = user?.is_admin === true;

  return (
    <div className="min-h-full bg-slate-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center gap-3">
          <Link
            to="/app"
            className="btn-ghost shrink-0"
            title="Back to dashboard"
          >
            <ArrowLeft size={15} />
          </Link>
          <div className="w-9 h-9 rounded-lg bg-brand-gradient text-white grid place-items-center shrink-0 shadow-glow">
            <Tag size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Keywords
            </h1>
            <p className="text-xs text-slate-500">
              Topics the monitoring agent tracks. The hourly scheduler runs
              against this list.
            </p>
          </div>
          {isAdmin ? (
            <span className="chip border-violet-200 bg-violet-50 text-violet-700">
              <Shield size={11} /> Admin
            </span>
          ) : (
            <span className="chip border-slate-200 bg-slate-50 text-slate-600">
              Read only
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-7 space-y-6">
        {error && (
          <div className="card border-rose-200 bg-rose-50 p-3 flex items-start gap-2 text-sm text-rose-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {isAdmin && (
          <form
            onSubmit={onAdd}
            className="card p-4 flex items-center gap-2"
          >
            <input
              className="input flex-1"
              placeholder="Add a keyword — e.g. dengue, inflation, EV market…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={submitting}
              maxLength={255}
            />
            <button
              className="btn-brand"
              type="submit"
              disabled={submitting || !draft.trim()}
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Add keyword
            </button>
          </form>
        )}

        <Section
          title="Active"
          count={active.length}
          empty="No active keywords yet."
        >
          {active.map((kw) => (
            <KeywordRow
              key={kw.id}
              kw={kw}
              isAdmin={isAdmin}
              editing={editingId === kw.id}
              editText={editText}
              setEditText={setEditText}
              startEdit={() => startEdit(kw)}
              cancelEdit={cancelEdit}
              saveEdit={() => saveEdit(kw.id)}
              toggleActive={() => toggleActive(kw)}
              onDelete={() => remove(kw.id)}
              pending={pendingId === kw.id}
            />
          ))}
        </Section>

        {inactive.length > 0 && (
          <Section
            title="Inactive"
            count={inactive.length}
            empty=""
            muted
          >
            {inactive.map((kw) => (
              <KeywordRow
                key={kw.id}
                kw={kw}
                isAdmin={isAdmin}
                editing={editingId === kw.id}
                editText={editText}
                setEditText={setEditText}
                startEdit={() => startEdit(kw)}
                cancelEdit={cancelEdit}
                saveEdit={() => saveEdit(kw.id)}
                toggleActive={() => toggleActive(kw)}
                onDelete={() => remove(kw.id)}
                pending={pendingId === kw.id}
              />
            ))}
          </Section>
        )}

        {loading && items.length === 0 && (
          <div className="card p-8 text-center text-sm text-slate-500">
            <Loader2 className="inline-block animate-spin mr-2" size={14} />
            Loading keywords…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="card p-8 text-center text-slate-500">
            <p className="font-semibold text-slate-700">No keywords yet.</p>
            <p className="text-sm mt-1">
              {isAdmin
                ? "Add one above to start monitoring."
                : "Ask an admin to add keywords."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  muted,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h2>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className={"flex flex-col gap-2 " + (muted ? "opacity-80" : "")}>
        {count === 0 && empty && (
          <div className="text-xs text-slate-400 italic px-1">{empty}</div>
        )}
        {children}
      </div>
    </section>
  );
}

interface RowProps {
  kw: Keyword;
  isAdmin: boolean;
  editing: boolean;
  editText: string;
  setEditText: (s: string) => void;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
  toggleActive: () => void;
  onDelete: () => void;
  pending: boolean;
}

function KeywordRow(p: RowProps) {
  const { kw, isAdmin, editing, pending } = p;
  return (
    <div className="card p-3 flex items-center gap-3 animate-fadeUp">
      <div
        className={
          "w-2 h-2 rounded-full shrink-0 " +
          (kw.is_active ? "bg-emerald-500" : "bg-slate-300")
        }
        title={kw.is_active ? "Active" : "Inactive"}
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            className="input"
            value={p.editText}
            onChange={(e) => p.setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") p.saveEdit();
              if (e.key === "Escape") p.cancelEdit();
            }}
            autoFocus
            maxLength={255}
            disabled={pending}
          />
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 truncate">
              {kw.text}
            </span>
            {kw.last_fetched_at && (
              <span className="text-[10.5px] text-slate-500">
                last fetched {timeAgo(kw.last_fetched_at)}
              </span>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <button
                className="btn-ghost text-emerald-700"
                onClick={p.saveEdit}
                disabled={pending}
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                className="btn-ghost"
                onClick={p.cancelEdit}
                disabled={pending}
                title="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-ghost"
                onClick={p.startEdit}
                disabled={pending}
                title="Rename"
              >
                <Edit2 size={14} />
              </button>
              <button
                className={
                  "btn-ghost " +
                  (kw.is_active ? "text-emerald-700" : "text-slate-400")
                }
                onClick={p.toggleActive}
                disabled={pending}
                title={kw.is_active ? "Deactivate" : "Activate"}
              >
                <Power size={14} />
              </button>
              <button
                className="btn-ghost text-rose-600 hover:bg-rose-50"
                onClick={p.onDelete}
                disabled={pending}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}
