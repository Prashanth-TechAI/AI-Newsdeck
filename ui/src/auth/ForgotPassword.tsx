import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, AlertCircle, ArrowRight, CheckCircle2, Copy } from "lucide-react";
import { forgotPassword } from "../api/auth";
import { AuthShell } from "./AuthShell";
import { Field } from "./SignIn";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message: string; devToken?: string | null } | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await forgotPassword(email.trim().toLowerCase());
      setDone({ message: r.message, devToken: r.dev_reset_token });
    } catch (err: any) {
      setError(err?.message || "Could not process the request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll issue a reset token."
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
        <div className="space-y-4 animate-fadeUp">
          <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            <span>{done.message}</span>
          </div>
          {done.devToken && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Dev mode — reset token
              </p>
              <p className="text-xs text-amber-700/90 mt-1">
                In production this would be sent by email. For now, use it on the
                reset-password page.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 font-mono text-xs bg-white border border-amber-200 rounded px-2 py-1.5 break-all">
                  {done.devToken}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(done.devToken!)}
                  className="btn-ghost text-xs"
                  title="Copy"
                >
                  <Copy size={13} />
                </button>
              </div>
              <Link
                to={`/reset-password?token=${encodeURIComponent(done.devToken)}`}
                className="btn-brand w-full mt-3"
              >
                Continue to reset
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
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
            icon={<Mail size={15} />}
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <button type="submit" className="btn-brand w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                Send reset link <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
