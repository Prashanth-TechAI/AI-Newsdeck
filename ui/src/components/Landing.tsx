import { Link, useNavigate } from "react-router-dom";
import {
  Newspaper,
  Sparkles,
  Search,
  Brain,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  Clock,
  BarChart3,
  Filter,
  Bell,
  Globe2,
  Star,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const FEATURES = [
  {
    icon: Search,
    title: "Fresh news, every hour",
    body:
      "Automated hourly scans pull articles from trusted news sources and public feeds for every topic you track.",
  },
  {
    icon: Brain,
    title: "AI summaries you can trust",
    body:
      "Each article is distilled into a short summary, category, and sentiment — so you scan the day in minutes, not hours.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard built for clarity",
    body:
      "Filter by topic, source, or date. Group articles by category, timeline, or sentiment with one click.",
  },
  {
    icon: BarChart3,
    title: "Analytics at a glance",
    body:
      "Track article volume, sentiment trends, and category distribution over time with built-in charts.",
  },
  {
    icon: Filter,
    title: "Zero noise, zero duplicates",
    body:
      "Smart deduplication and on-topic filtering keep your feed focused on what actually matters.",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    body:
      "Your keywords and dashboards stay yours. Role-based access and encrypted credentials by default.",
  },
];

const TOPICS = [
  "Dengue outbreak",
  "Inflation",
  "EV market",
  "Water contamination",
  "AI regulation",
  "Climate policy",
  "Cybersecurity",
  "Stock market",
];

const STEPS = [
  {
    n: "01",
    title: "Add the topics you care about",
    body: "Dengue, inflation, EV market — any keyword, any language. Edit or remove them whenever you like.",
  },
  {
    n: "02",
    title: "Let the agent do the reading",
    body: "We continuously fetch fresh articles, remove duplicates, and summarize each one with AI.",
  },
  {
    n: "03",
    title: "Open your dashboard",
    body: "Latest articles, sentiment trends, and category breakdowns — all in one place, always up to date.",
  },
];

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const primaryHref = user ? "/app" : "/signup";
  const primaryLabel = user ? "Open dashboard" : "Get started free";

  return (
    <div className="min-h-full bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-gradient text-white grid place-items-center shadow-glow">
              <Newspaper size={17} />
            </div>
            <div className="leading-none">
              <span className="text-[15px] font-extrabold tracking-tight">
                AI <span className="brand-text">Newsdeck</span>
              </span>
              <p className="text-[10.5px] text-slate-500 mt-1 font-medium">
                Intelligent dashboard
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 ml-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">
              Features
            </a>
            <a href="#how" className="hover:text-slate-900 transition">
              How it works
            </a>
            <a href="#use-cases" className="hover:text-slate-900 transition">
              Use cases
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <button
                onClick={() => navigate("/app")}
                className="btn-brand !py-2 !px-4 text-sm"
              >
                Open dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn-brand !py-2 !px-4 text-sm"
                >
                  Sign up <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-mesh pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[820px] h-[820px] rounded-full bg-brand-gradient opacity-[0.07] blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center animate-fadeUp">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent bg-accent-soft border border-accent-border rounded-full px-3 py-1">
            <Sparkles size={11} />
            AI news monitoring, made simple
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Monitor the news{" "}
            <span className="brand-text">that moves your work</span>.
          </h1>
          <p className="mt-6 text-[17px] text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Set the keywords you care about — outbreaks, markets, regulation,
            anything. We fetch, summarize, and organize the latest articles
            into a dashboard you can scan in seconds.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to={primaryHref} className="btn-brand !px-6 !py-3.5 text-[15px]">
              {primaryLabel}
              <ArrowRight size={16} />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              See how it works
            </a>
          </div>

          <div className="mt-7 flex items-center justify-center gap-5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-500" />
              Secure login
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-accent" />
              Auto-refresh hourly
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bell size={13} className="text-violet-500" />
              No spam, ever
            </span>
          </div>

          {/* Floating preview card */}
          <div className="mt-16 relative max-w-4xl mx-auto animate-fadeUp" style={{ animationDelay: "120ms" }}>
            <div className="absolute -inset-x-10 -inset-y-6 bg-brand-gradient opacity-[0.08] blur-3xl rounded-[40px] pointer-events-none" />
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-cardHover overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2 bg-slate-50/60">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                <div className="ml-3 text-[11px] text-slate-500 font-medium">
                  ai-newsdeck · dashboard
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5 text-left">
                {[
                  {
                    cat: "Health",
                    tone: "border-rose-200 bg-rose-50 text-rose-700",
                    title: "Dengue cases spike across coastal districts",
                    src: "Reuters",
                  },
                  {
                    cat: "Finance",
                    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
                    title: "Inflation cools to a 3-month low, markets rally",
                    src: "Bloomberg",
                  },
                  {
                    cat: "Tech",
                    tone: "border-violet-200 bg-violet-50 text-violet-700",
                    title: "EV market share crosses 18% in the latest quarter",
                    src: "The Verge",
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="rounded-xl border border-slate-200 p-3.5 hover:shadow-card transition bg-white"
                  >
                    <span className={`chip text-[10px] ${c.tone}`}>{c.cat}</span>
                    <p className="mt-2.5 text-[13.5px] font-semibold leading-snug text-slate-900">
                      {c.title}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Globe2 size={11} />
                      {c.src}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Topics strip */}
      <section className="border-y border-slate-200 bg-slate-50/40">
        <div className="max-w-6xl mx-auto px-6 py-7 flex flex-wrap items-center gap-3">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Popular topics
          </span>
          <span className="text-slate-300">·</span>
          {TOPICS.map((t) => (
            <span
              key={t}
              className="chip border-slate-200 bg-white text-slate-700"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent bg-accent-soft border border-accent-border rounded-full px-3 py-1">
            Features
          </span>
          <h2 className="mt-5 text-3xl md:text-4xl font-extrabold tracking-tight">
            Everything you need to stay informed —{" "}
            <span className="brand-text">without the noise</span>.
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            From keyword setup to actionable analytics, the platform handles
            the grunt work so you can focus on what the news actually means.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="card p-6 animate-fadeUp"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent grid place-items-center">
                <Icon size={18} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 text-[15.5px]">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-50/60 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent bg-accent-soft border border-accent-border rounded-full px-3 py-1">
              How it works
            </span>
            <h2 className="mt-5 text-3xl md:text-4xl font-extrabold tracking-tight">
              Three steps. <span className="brand-text">No setup pain.</span>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="card p-6 relative animate-fadeUp"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-[11px] font-extrabold tracking-[0.18em] text-accent">
                  STEP {s.n}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900 text-[16px] leading-snug">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {s.body}
                </p>
                {i < STEPS.length - 1 && (
                  <ArrowRight
                    size={16}
                    className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent bg-accent-soft border border-accent-border rounded-full px-3 py-1">
              Use cases
            </span>
            <h2 className="mt-5 text-3xl md:text-4xl font-extrabold tracking-tight">
              Built for teams that{" "}
              <span className="brand-text">live in the news</span>.
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Public-health officers tracking outbreaks. Analysts watching
              markets. PR teams monitoring brand mentions. Researchers tracking
              policy shifts. One dashboard, every topic.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "Track outbreaks like dengue or water contamination in real time",
                "Watch inflation, commodities, or sector-specific market signals",
                "Monitor regulatory changes across multiple jurisdictions",
                "Stay ahead of brand mentions and competitor coverage",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {line}
                </li>
              ))}
            </ul>

            <Link
              to={primaryHref}
              className="mt-9 inline-flex btn-brand !px-5 !py-3 text-sm"
            >
              {primaryLabel} <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                k: "Articles processed",
                v: "1.2M+",
                icon: Newspaper,
                tone: "text-accent bg-accent-soft",
              },
              {
                k: "Avg. summarization",
                v: "8s",
                icon: Clock,
                tone: "text-emerald-700 bg-emerald-50",
              },
              {
                k: "Sources covered",
                v: "120+",
                icon: Globe2,
                tone: "text-violet-700 bg-violet-50",
              },
              {
                k: "Customer rating",
                v: "4.9 / 5",
                icon: Star,
                tone: "text-amber-700 bg-amber-50",
              },
            ].map(({ k, v, icon: Icon, tone }, i) => (
              <div
                key={k}
                className="card p-5 animate-fadeUp"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className={`w-9 h-9 rounded-lg grid place-items-center ${tone}`}
                >
                  <Icon size={16} />
                </div>
                <div className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
                  {v}
                </div>
                <div className="text-[11.5px] font-medium uppercase tracking-wider text-slate-500 mt-1">
                  {k}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto relative overflow-hidden rounded-3xl bg-brand-gradient text-white p-10 md:p-14 shadow-glow">
          <div className="absolute inset-0 bg-hero-mesh opacity-30 pointer-events-none" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider bg-white/15 border border-white/20 rounded-full px-3 py-1">
              <Sparkles size={11} />
              Ready in under a minute
            </span>
            <h2 className="mt-5 text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Start tracking the news that matters today.
            </h2>
            <p className="mt-4 text-white/85 leading-relaxed">
              Create your account, add the topics you care about, and watch
              your dashboard fill up with curated, summarized articles in
              seconds.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={primaryHref}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 font-semibold px-6 py-3.5 text-[15px] hover:bg-slate-100 transition"
              >
                {primaryLabel} <ArrowRight size={16} />
              </Link>
              {!user && (
                <Link
                  to="/signin"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 text-white font-semibold px-6 py-3.5 text-[15px] hover:bg-white/10 transition"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-gradient text-white grid place-items-center">
              <Newspaper size={11} />
            </div>
            <span className="font-semibold text-slate-700">
              AI Newsdeck
            </span>
            <span className="text-slate-300">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-slate-700">Features</a>
            <a href="#how" className="hover:text-slate-700">How it works</a>
            <Link to="/signin" className="hover:text-slate-700">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
