import { ReactNode } from "react";
import { Newspaper, Sparkles } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-full grid md:grid-cols-2 bg-white">
      {/* Form panel */}
      <div className="flex flex-col px-6 sm:px-12 lg:px-20 py-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-gradient text-white grid place-items-center shadow-glow">
            <Newspaper size={17} />
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold tracking-tight leading-none text-slate-900">
              AI <span className="brand-text">Newsdeck</span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-1">Intelligent dashboard</p>
          </div>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto animate-fadeUp">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-600 mt-2">{subtitle}</p>
            )}
            <div className="mt-7">{children}</div>
            {footer && (
              <div className="mt-6 text-sm text-slate-600">{footer}</div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-4">
          © {new Date().getFullYear()} AI Newsdeck · POC
        </p>
      </div>

      {/* Brand panel */}
      <div className="hidden md:flex relative items-center justify-center bg-brand-gradient text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-hero-mesh" />
        <div className="relative max-w-md px-12 py-16 animate-fadeUp">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider bg-white/15 border border-white/20 rounded-full px-3 py-1">
            <Sparkles size={11} />
            AI agent inside
          </span>
          <h3 className="mt-5 text-3xl font-extrabold tracking-tight leading-tight">
            Monitor the news that moves your business.
          </h3>
          <p className="mt-4 text-white/85 leading-relaxed">
            Configure keywords. Let the agent fetch, summarize, and organize
            relevant articles into a dashboard tailored to you.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Track unlimited topics with always-on monitoring",
              "AI summaries, categories, and sentiment for every article",
              "Group by category, timeline, or source",
              "Importance × relevance scoring on every article",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                <span className="text-white/90">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
