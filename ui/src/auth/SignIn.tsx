import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthShell } from "./AuthShell";

export function SignIn() {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signin(email.trim().toLowerCase(), password);
      const dest = (location.state as any)?.from?.pathname ?? "/app";
      navigate(dest, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your AI Newsdeck dashboard."
      footer={
        <>
          New to AI Newsdeck?{" "}
          <Link
            to="/signup"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Create an account
          </Link>
        </>
      }
    >
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
        <Field
          icon={<Lock size={15} />}
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
          minLength={8}
        />
        <div className="flex justify-end -mt-1">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-slate-500 hover:text-accent"
          >
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn-brand w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}

export function Field({
  icon,
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder,
}: FieldProps) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="relative mt-1.5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
        <input
          className="input pl-9"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}
