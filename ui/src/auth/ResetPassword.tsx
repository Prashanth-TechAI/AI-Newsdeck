import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Key, Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { resetPassword } from "../api/auth";
import { AuthShell } from "./AuthShell";
import { Field } from "./SignIn";

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token.trim(), password);
      setDone(true);
      setTimeout(() => navigate("/signin", { replace: true }), 1800);
    } catch (err: any) {
      setError(err?.message || "Reset failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Paste the reset token and choose a new password."
      footer={
        <>
          Back to{" "}
          <Link
            to="/signin"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            sign in
          </Link>
        </>
      }
    >
      {done ? (
        <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 animate-fadeUp">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          <span>Password updated. Redirecting to sign-in…</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          <Field
            icon={<Key size={15} />}
            label="Reset token"
            type="text"
            value={token}
            onChange={setToken}
            required
            placeholder="From the reset email / forgot-password response"
          />
          <Field
            icon={<Lock size={15} />}
            label="New password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Field
            icon={<Lock size={15} />}
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <button type="submit" className="btn-brand w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Updating…
              </>
            ) : (
              <>
                Update password <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
