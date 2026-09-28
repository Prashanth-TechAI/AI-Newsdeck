import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, User, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthShell } from "./AuthShell";
import { Field } from "./SignIn";

export function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await signup(email.trim().toLowerCase(), name.trim(), password);
      navigate("/app", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Sign-up failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Get started in seconds. The first account becomes the admin."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Sign in
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
          icon={<User size={15} />}
          label="Full name"
          type="text"
          value={name}
          onChange={setName}
          autoComplete="name"
          required
        />
        <Field
          icon={<Mail size={15} />}
          label="Work email"
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
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
        <button type="submit" className="btn-brand w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight size={15} />
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-400 text-center">
          By creating an account you agree to use this internal tool responsibly.
        </p>
      </form>
    </AuthShell>
  );
}
