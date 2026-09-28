# AI News Monitoring Dashboard

> Requirements document + live build status.

---

## 📋 Build status at a glance

| Section | Status |
|---|---|
| 2.1 Keyword Configuration | 🟡 Partial (backend 🟢, admin UI page 🔴) |
| 2.2 News Fetching        | 🟡 Partial |
| 2.3 Article Processing   | 🟢 Done |
| 2.4 AI Summarization     | 🟢 Done |
| 2.5 SQL Storage          | 🟢 Done |
| 2.6 Dashboard            | 🟡 Partial (backend 🟢, charts UI 🔴) |
| 2.7 Scheduler            | 🟢 Done (backend) |
| 2.8 Authentication       | 🟢 Done (exceeds spec) |
| 3.  Tech stack           | 🟢 Done |
| 4.  Deliverables         | 🟡 Partial |
| 5.  MVP Goal             | 🟢 Done |

Legend: 🟢 Done · 🟡 Partial · 🔴 Not built

---

## 1. Objective

Build a web-based system that fetches online news articles related to predefined keywords and displays them in a dashboard.

The system should:

- fetch articles from online sources,
- summarize articles using AI,
- store records in SQL database tables,
- and display the processed information in dashboards.

---

## 2. Core Features

### 2.1 Keyword Configuration — 🟡 Partial (admin UI page pending)

**Spec:** Admin should be able to add / edit / delete keywords.

| Item | Status |
|---|---|
| Keyword data persisted in Postgres `keywords` table | 🟢 Done |
| `GET /api/keywords` (any signed-in user) | 🟢 Done |
| `POST /api/keywords` (admin only) | 🟢 Done |
| `PUT /api/keywords/{id}` (admin only) | 🟢 Done |
| `DELETE /api/keywords/{id}` (admin only) | 🟢 Done |
| Case-insensitive uniqueness (DB index + Python check) | 🟢 Done |
| Active / inactive toggle | 🟢 Done |
| `last_fetched_at` tracking for scheduler | 🟢 Done |
| Admin-only management page in UI | 🔴 To do |
| Sidebar uses DB list instead of in-memory | 🔴 To do |

---

### 2.2 News Fetching — 🟡 Partial

| Item | Status |
|---|---|
| Duplicate prevention (URL hash dedup) | 🟢 Done |
| Source URL storage | 🟢 Done |
| Publish date extraction | 🟢 Done |
| Source: Tavily API (paid) | 🟢 Substituted |
| **Scheduled fetching** | 🟢 **Done (see 2.7)** |
| Source: Google News RSS | 🔴 To do |
| Source: Public RSS feeds | 🔴 To do |
| Selected websites scraping | 🔴 To do |

---

### 2.3 Article Processing — 🟢 Done

All fields extracted: title, content, source, publish date, URL.

---

### 2.4 AI Summarization — 🟢 Done (+ extras)

Summary, category, sentiment, plus importance (1-10), relevance (0-10), key_points, tags.
Claude Sonnet 4.6 via OpenRouter, structured JSON output, retries via tenacity.

---

### 2.5 SQL Storage — 🟢 Done

Postgres `articles` table with all spec fields + agent extras.
Upsert by `article_url` (no duplicates ever).
Tables in DB now: `users`, `keywords`, `articles`, `fetch_runs`.

---

### 2.6 Dashboard — 🟡 Partial (backend done, charts UI pending)

| Item | Status |
|---|---|
| Latest articles feed (per-run) | 🟢 Done |
| Per-article summary cards | 🟢 Done |
| 4 layouts: Grid / Category / Timeline / Source | 🟢 Done |
| `GET /api/articles` with filters + pagination | 🟢 Done |
| `GET /api/analytics` (category dist, sentiment dist, source top 10, keyword dist, importance buckets, daily timeline) | 🟢 Done |
| Dashboard wired to `/api/articles` (history view, not just last run) | 🔴 To do |
| Category distribution chart in UI | 🔴 To do |
| Sentiment distribution chart in UI | 🔴 To do |
| Timeline chart in UI | 🔴 To do |
| In-page filter chips (category / source / sentiment) | 🔴 To do |
| Featured / hero article card | 🔴 To do |
| Scheduler status badge in UI | 🔴 To do |
| ➕ Agent reasoning trace panel | 🟢 Bonus |

---

### 2.7 Scheduler — 🟢 Done (backend)

| Item | Status |
|---|---|
| Automatic hourly scan (APScheduler `AsyncIOScheduler`) | 🟢 Done |
| Background processing (in-process job) | 🟢 Done |
| Retry mechanism (`tenacity` + agent self-evaluate loop) | 🟢 Done |
| Run audit log (`fetch_runs` table) | 🟢 Done |
| `GET /api/scheduler/status` | 🟢 Done |
| `GET /api/scheduler/runs` (paginated history) | 🟢 Done |
| `POST /api/scheduler/run-now` (admin manual trigger) | 🟢 Done |
| Overlap protection (`asyncio.Lock`) | 🟢 Done |
| Updates `Keyword.last_fetched_at` each run | 🟢 Done |
| Configurable interval / max keywords / enabled via env | 🟢 Done |

---

### 2.8 Authentication — 🟢 Done (exceeds spec)

Spec asked for admin login + password. Built: signup, signin, forgot/reset password, JWT, `/api/auth/me`, protected frontend routes, user menu, admin flag, bcrypt, anti-enumeration on forgot-password.

---

## 3. Suggested Tech Stack — 🟢 Done

| Spec | Used |
|---|---|
| Python + FastAPI | 🟢 FastAPI + uvicorn + SQLAlchemy 2.0 async |
| React | 🟢 React 18 + Vite + TypeScript + Tailwind + recharts |
| MySQL/PostgreSQL | 🟢 PostgreSQL via `asyncpg` |
| OpenAI API | 🟢 Claude Sonnet 4.6 via OpenRouter (OpenAI-compatible SDK) |

**Bonus infra:** LangGraph (real agent) · Redis cache · APScheduler.

---

## 4. Deliverables — 🟡 Partial

| Item | Status |
|---|---|
| Source code | 🟢 In repo |
| Database schema | 🟢 SQLAlchemy models match spec |
| Deployment setup | 🔴 Only dev scripts. Need Docker + docker-compose |
| API documentation | 🟡 Auto-generated Swagger at `/docs`; written `API.md` pending |
| Dashboard UI | 🟢 Built (charts pending) |

---

## 5. MVP Goal — 🟢 Done

✓ Fetch · ✓ Summarize · ✓ Store · ✓ Display.

---

## 🛠 What's left to build

| # | Item | Section | Effort |
|---|---|---|---|
| 1 | **Admin keyword management UI** (page + sidebar-from-DB) | 2.1 | ~1 h |
| 2 | **Wire dashboard to `/api/articles`** (history view + filters) | 2.6 | ~45 min |
| 3 | **Analytics charts UI** (category + sentiment + timeline + sources) | 2.6 | ~1.5 h |
| 4 | **In-page filter chips** (category / source / sentiment) | 2.6 | ~30 min |
| 5 | **Featured / hero article card** | 2.6 | ~20 min |
| 6 | **Scheduler status badge** in header | 2.7 | ~15 min |
| 7 | **RSS adapter** (Google News RSS + publisher feeds + trafilatura) | 2.2 | ~1.5 h |
| 8 | **Docker + docker-compose** (backend, frontend, postgres, redis) | 4 | ~45 min |
| 9 | **`API.md`** (written endpoint reference) | 4 | ~30 min |

Total ≈ **6 hours** to fully meet the spec.

---

## 🆕 Out-of-scope: separate **Dashboard Agent** (client follow-up)

> Distinct from the current News Agent — quoted separately, NOT part of this build.

User types natural-language analyses → AI builds SQL → renders charts → live-updates from DB.
**Effort:** ~12–14 h · **Price:** ₹15–20k extra (own track, own quote).

---

## 📂 Repository layout

```
.
├── backend/
│   ├── app/
│   │   ├── auth/                        # signup, signin, JWT, bcrypt, reset
│   │   │   └── admin.py                 # admin-only dependency
│   │   ├── news/
│   │   │   ├── db_models.py             # Keyword · Article · FetchRun
│   │   │   ├── schemas.py               # Pydantic models
│   │   │   ├── repo.py                  # article upsert
│   │   │   ├── routes_keywords.py       # /api/keywords CRUD
│   │   │   ├── routes_articles.py       # /api/articles + /api/analytics
│   │   │   └── routes_scheduler.py      # /api/scheduler/*
│   │   ├── services/                    # Tavily · Claude · LangGraph agent
│   │   ├── cache.py                     # Redis (optional)
│   │   ├── scheduler.py                 # APScheduler + run audit
│   │   ├── config.py
│   │   ├── db.py
│   │   └── main.py
│   ├── pyproject.toml
│   └── run.sh
├── ui/
│   ├── src/
│   │   ├── auth/                        # SignIn · SignUp · ForgotPassword · ResetPassword
│   │   ├── components/                  # Sidebar · Dashboard · ArticleCard · Header · AgentTrace
│   │   ├── api/                         # auth + news clients
│   │   └── App.tsx
│   └── package.json
├── .env                                 # OPENROUTER · TAVILY · DATABASE_URL · REDIS_URL · JWT_SECRET
└── NEED.md                              # ← you are here
```

---

# 🌐 PART 1: Where the AI agent fetches news from

Your current code uses **Tavily** as the primary source (not Google News RSS). Here's the actual flow:

```
                    ┌─────────────────────────┐
                    │  USER ADDS KEYWORDS     │
                    │  • dengue               │
                    │  • EV market            │
                    │  • inflation            │
                    └───────────┬─────────────┘
                                │
                                ▼
        ┌────────────────────────────────────────────┐
        │   AI AGENT (LangGraph - 6 stages)          │
        │                                            │
        │   [1] PLAN     Claude decides: "for        │
        │                'dengue' → search news,     │
        │                last 7 days, queries:       │
        │                'dengue outbreak 2026',     │
        │                'dengue cases India'"       │
        │                                            │
        │   [2] SEARCH   ──────────────►             │
        │                                            │
        │                    ┌──────────────────┐    │
        │                    │  TAVILY API      │    │
        │                    │  (search engine) │    │
        │                    └────────┬─────────┘    │
        │                             │              │
        │                             ▼              │
        │              Tavily crawls these in real-time:
        │              • Reuters.com                 │
        │              • BBC.com                     │
        │              • TheHindu.com                │
        │              • TimesofIndia.com            │
        │              • Bloomberg.com               │
        │              • NDTV.com                    │
        │              • CNN.com                     │
        │              • + 1000s of news sites       │
        │                             │              │
        │                             ▼              │
        │              Returns: title, URL, full     │
        │              article body, source, date    │
        │                                            │
        │   [3] DEDUPE   Drop duplicate URLs         │
        │                                            │
        │   [4] EVALUATE Claude judges: "are these   │
        │                actually about dengue?"     │
        │                If no → retry with new      │
        │                queries                     │
        │                                            │
        │   [5] SUMMARIZE Each article → Claude →    │
        │                  {summary, category,       │
        │                   sentiment, importance}   │
        │                                            │
        │   [6] RANK     Sort by importance × date   │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
                ┌────────────────────┐
                │  POSTGRESQL DB     │
                │  articles table    │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │   REACT DASHBOARD  │
                └────────────────────┘
```

So the actual sources are:

- **Tavily** = search engine that crawls the entire news web in real-time. You don't pick sources — Tavily picks the best matches across thousands of sites.
- **Free tier:** 1,000 searches/month
- 1 keyword = 1 search → with 10 keywords/hour scheduled → ~7,200 searches/month → you'll hit limit. Plan for $30/mo Tavily upgrade OR cut scheduler to every 6 hours.

You could ALSO add (the spec mentioned these):
- **Google News RSS** — `news.google.com/rss/search?q=dengue` (free, unlimited)
- **Specific publisher RSS** (BBC, Reuters, AP) — free, reliable

---

# 🖥️ PART 2: Full UI Dashboard — every screen

## Screen 1️⃣ — Login Page

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                  🎯  NewsPulse                              │
│                  AI News Dashboard                          │
│                                                              │
│         ┌──────────────────────────────────────┐             │
│         │  Sign in to your account             │             │
│         │                                      │             │
│         │  Email                               │             │
│         │  ┌────────────────────────────────┐  │             │
│         │  │ rohan@company.com              │  │             │
│         │  └────────────────────────────────┘  │             │
│         │                                      │             │
│         │  Password                            │             │
│         │  ┌────────────────────────────────┐  │             │
│         │  │ ••••••••••                     │  │             │
│         │  └────────────────────────────────┘  │             │
│         │                                      │             │
│         │  ┌────────────────────────────────┐  │             │
│         │  │       Sign In                  │  │             │
│         │  └────────────────────────────────┘  │             │
│         │                                      │             │
│         │  Forgot password?  •  Sign up        │             │
│         └──────────────────────────────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen 2️⃣ — Main News Feed (Grid layout)

```
┌────────────────┬─────────────────────────────────────────────────────┐
│  NewsPulse     │  📰 News Feed          🟢 Live • Updated 12 sec ago │
│                │                                                     │
│  📰 Feed       │  ┌─────────────────────────────────────────────────┐│
│  📊 Analytics  │  │ FEATURED                                        ││
│  ⚙ Keywords   │  │ ┌──────┐  💉 Health  •  🔴 Negative  •  ⭐ 9/10  ││
│  📅 Scheduler  │  │ │ IMG  │  Dengue cases surge 40% in Bangalore   ││
│  👤 Settings   │  │ └──────┘  Reuters • 2h ago                      ││
│                │  │  Bangalore reports highest dengue cases since   ││
│  ─────────     │  │  2019, hospitals overwhelmed. Civic body...     ││
│                │  │  • 1,200 new cases this week                    ││
│  KEYWORDS      │  │  • 3 deaths reported                            ││
│  ✅ dengue     │  │  • Fogging operations doubled                   ││
│  ✅ EV market  │  │  → Read full article                            ││
│  ✅ inflation  │  └─────────────────────────────────────────────────┘│
│                │                                                     │
│  [+ Add new]   │  ╔═══ Filters ═══╗                                  │
│                │  Category: [All ▾]  Sentiment: [All ▾]              │
│  ─────────     │  Source:   [All ▾]  Date:      [Last 7 days ▾]      │
│                │                                                     │
│  ⏱ Auto-fetch  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  Every 1 hour  │  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │
│  Next: 23 min  │  │ │  IMG     │ │ │ │  IMG     │ │ │ │  IMG     │ │ │
│                │  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │
│  [▶ Run now]   │  │ 💼 Business  │ │ 💉 Health    │ │ 💰 Finance   │ │
│                │  │ 🟢 Positive  │ │ 🟡 Neutral   │ │ 🔴 Negative  │ │
│                │  │ ⭐ 7/10      │ │ ⭐ 6/10      │ │ ⭐ 8/10      │ │
│                │  │              │ │              │ │              │ │
│                │  │ Tata Motors  │ │ Dengue vacc- │ │ Inflation    │ │
│                │  │ EV sales hit │ │ ine trial    │ │ jumps to 6.2%│ │
│                │  │ record high  │ │ enters phase │ │ in October   │ │
│                │  │              │ │ 3            │ │              │ │
│                │  │ BBC • 4h     │ │ Hindu • 6h   │ │ Mint • 5h    │ │
│                │  │              │ │              │ │              │ │
│                │  │ EV market    │ │ dengue       │ │ inflation    │ │
│                │  └──────────────┘ └──────────────┘ └──────────────┘ │
│                │                                                     │
│                │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│                │  │ ...          │ │ ...          │ │ ...          │ │
│                │  └──────────────┘ └──────────────┘ └──────────────┘ │
│                │                                                     │
│                │             [Load more]   Showing 12 of 47          │
└────────────────┴─────────────────────────────────────────────────────┘
```

**What user sees in each card:**
- Image (if available)
- Category emoji + Sentiment color + Importance star rating
- Headline
- AI-generated 2-line summary
- Source • time ago
- Keyword tag
- Click → full article opens in new tab

---

## Screen 3️⃣ — Analytics Dashboard

```
┌────────────────┬─────────────────────────────────────────────────────┐
│  NewsPulse     │  📊 Analytics      Range: [Last 7 days ▾]   [Export]│
│                │                                                     │
│  📰 Feed       │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  📊 Analytics ◀│  │ TOTAL   │ │POSITIVE │ │NEGATIVE │ │AVG IMP. │    │
│  ⚙ Keywords   │  │  247    │ │  82     │ │  91     │ │  6.3    │    │
│  📅 Scheduler  │  │ articles│ │ ▲ +12%  │ │ ▲ +28%  │ │ /10     │    │
│  👤 Settings   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                │                                                     │
│                │  ╔══ Articles per day ══════════════════════════╗   │
│                │  ║                                              ║   │
│                │  ║  50│            ╱╲                           ║   │
│                │  ║  40│       ╱╲  ╱  ╲     ╱╲                   ║   │
│                │  ║  30│  ╱╲  ╱  ╲╱    ╲   ╱  ╲___               ║   │
│                │  ║  20│ ╱  ╲╱                                    ║   │
│                │  ║  10│                                          ║   │
│                │  ║    └──────────────────────────────            ║   │
│                │  ║     Mon  Tue  Wed  Thu  Fri  Sat  Sun         ║   │
│                │  ╚══════════════════════════════════════════════╝   │
│                │                                                     │
│                │  ╔══ Category breakdown ═══╗  ╔══ Sentiment ═══╗    │
│                │  ║                         ║  ║                ║    │
│                │  ║       ╭─────╮           ║  ║  Positive      ║    │
│                │  ║     ╱ Health ╲          ║  ║  ▓▓▓▓▓▓▓ 33%   ║    │
│                │  ║    │  28%    │          ║  ║                ║    │
│                │  ║    │ Business│ Politics ║  ║  Neutral       ║    │
│                │  ║     ╲  22%  ╱   18%    ║  ║  ▓▓▓▓▓ 30%     ║    │
│                │  ║       ╰─────╯           ║  ║                ║    │
│                │  ║   Tech 15% | Other 17%  ║  ║  Negative      ║    │
│                │  ║                         ║  ║  ▓▓▓▓▓▓▓▓ 37%  ║    │
│                │  ╚═════════════════════════╝  ╚════════════════╝    │
│                │                                                     │
│                │  ╔══ Top sources ════════════╗  ╔══ Keywords ═════╗ │
│                │  ║  Reuters     ▓▓▓▓▓▓▓▓ 45  ║  ║ inflation  ▓▓ 87║ │
│                │  ║  BBC         ▓▓▓▓▓▓ 38    ║  ║ EV market  ▓▓ 64║ │
│                │  ║  Bloomberg   ▓▓▓▓▓ 31     ║  ║ dengue     ▓ 41 ║ │
│                │  ║  Hindu       ▓▓▓▓ 27      ║  ║ AI         ▓ 28 ║ │
│                │  ║  TOI         ▓▓▓ 19       ║  ║ climate    ▓ 12 ║ │
│                │  ╚═══════════════════════════╝  ╚═════════════════╝ │
└────────────────┴─────────────────────────────────────────────────────┘
```

---

## Screen 4️⃣ — Keyword Management

```
┌────────────────┬─────────────────────────────────────────────────────┐
│  NewsPulse     │  ⚙ Keywords                                         │
│                │                                                     │
│  📰 Feed       │  Manage what your AI agent monitors. Add up to 20.  │
│  📊 Analytics  │                                                     │
│  ⚙ Keywords  ◀ │  ┌────────────────────────────────────┬──────────┐  │
│  📅 Scheduler  │  │  Add new keyword...                │  + Add   │  │
│  👤 Settings   │  └────────────────────────────────────┴──────────┘  │
│                │                                                     │
│                │  ┌──────────────────────────────────────────────────┐│
│                │  │ ✓ dengue              28 articles • Active       ││
│                │  │   Last fetched: 23 min ago    [⏸ Pause] [✏][🗑]  ││
│                │  ├──────────────────────────────────────────────────┤│
│                │  │ ✓ EV market           64 articles • Active       ││
│                │  │   Last fetched: 23 min ago    [⏸ Pause] [✏][🗑]  ││
│                │  ├──────────────────────────────────────────────────┤│
│                │  │ ✓ inflation           87 articles • Active       ││
│                │  │   Last fetched: 23 min ago    [⏸ Pause] [✏][🗑]  ││
│                │  ├──────────────────────────────────────────────────┤│
│                │  │ ⏸ water contamination  3 articles • Paused      ││
│                │  │   Last fetched: 2 days ago    [▶ Resume][✏][🗑]  ││
│                │  └──────────────────────────────────────────────────┘│
│                │                                                     │
│                │  Total: 4 keywords  •  3 active  •  182 articles    │
└────────────────┴─────────────────────────────────────────────────────┘
```

---

## Screen 5️⃣ — Scheduler / Auto-fetch settings

```
┌────────────────┬─────────────────────────────────────────────────────┐
│  NewsPulse     │  📅 Scheduler                                       │
│                │                                                     │
│  📰 Feed       │  ┌──────────────────────────────────────────────────┐│
│  📊 Analytics  │  │  STATUS                                          ││
│  ⚙ Keywords   │  │                                                  ││
│  📅 Scheduler ◀│  │  🟢 Running   Next fetch in: 23 min              ││
│  👤 Settings   │  │  Last fetch: 12:00 PM • Found 14 new articles    ││
│                │  │                                                  ││
│                │  │  [⏸ Pause scheduler]  [▶ Run now]                ││
│                │  └──────────────────────────────────────────────────┘│
│                │                                                     │
│                │  Fetch frequency:                                   │
│                │  ◯ Every 30 min                                     │
│                │  ⦿ Every 1 hour      ← (recommended)                │
│                │  ◯ Every 3 hours                                    │
│                │  ◯ Every 6 hours                                    │
│                │  ◯ Once a day                                       │
│                │                                                     │
│                │  Articles per keyword per fetch:                    │
│                │  ┌─────────────────────────┐                        │
│                │  │ ━━━━━━━━●━━━━━ 6        │ (3-15)                 │
│                │  └─────────────────────────┘                        │
│                │                                                     │
│                │  ╔══ Recent runs ═══════════════════════════╗       │
│                │  ║ Time      Status   Keywords  Articles    ║       │
│                │  ║ 12:00 PM  ✅ ok    4         14          ║       │
│                │  ║ 11:00 AM  ✅ ok    4         9           ║       │
│                │  ║ 10:00 AM  ⚠ skip   —         —           ║       │
│                │  ║ 09:00 AM  ✅ ok    4         11          ║       │
│                │  ║ 08:00 AM  ❌ fail  4         0  (Tavily) ║       │
│                │  ╚═══════════════════════════════════════════╝       │
└────────────────┴─────────────────────────────────────────────────────┘
```

---

## Screen 6️⃣ — Article detail (when user clicks a card)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ←  Back to feed                              🔗 Open original site  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │     [Large article image]                                      │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  💉 Health  •  🔴 Negative  •  ⭐ Importance 9/10                    │
│  Tags:  #dengue  #bangalore  #publichealth  #monsoon                 │
│                                                                      │
│  Dengue cases surge 40% in Bangalore amid monsoon                    │
│  ═══════════════════════════════════════════════════════════         │
│  Reuters  •  Published Nov 14, 2026, 10:23 AM                        │
│  Keyword: dengue  •  Fetched 2h ago                                  │
│                                                                      │
│  📋 AI SUMMARY                                                       │
│  ─────────────                                                       │
│  Bangalore is reporting a 40% week-over-week surge in dengue         │
│  cases, marking the highest count since 2019. Civic authorities      │
│  have doubled fogging operations, and three deaths have been         │
│  confirmed. Hospitals are nearing capacity in three districts.       │
│                                                                      │
│  🔑 KEY POINTS                                                       │
│  ──────────────                                                      │
│  • 1,200 new cases reported this week                                │
│  • 3 dengue-related deaths confirmed                                 │
│  • Fogging operations doubled across BBMP zones                      │
│  • Hospitals in 3 districts at 90%+ capacity                         │
│  • Health minister calls emergency meeting                           │
│                                                                      │
│  [🔗 Read full article on Reuters →]                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Screen 7️⃣ — (PHASE 2 if Rohan pays for dynamic dashboards)

```
┌────────────────┬─────────────────────────────────────────────────────┐
│  NewsPulse     │  🎨 My Custom Dashboard      [+ Add widget]         │
│                │                                                     │
│  📰 Feed       │  ┌─────────────────────────┐ ┌────────────────────┐ │
│  📊 Analytics  │  │ "Articles per day this  │ │ "Negative Reuters  │ │
│  🎨 Custom    ◀│  │  week"            [✏️🗑] │ │  this month" [✏️🗑]│ │
│  ⚙ Keywords   │  │                         │ │                    │ │
│  📅 Scheduler  │  │  📈 line chart          │ │      17            │ │
│                │  │                         │ │   ▼ 23%            │ │
│                │  └─────────────────────────┘ └────────────────────┘ │
│                │                                                     │
│                │  ┌─────────────────────────┐ ┌────────────────────┐ │
│                │  │ "Trending keywords"[✏️🗑]│ │"Top negative srcs" │ │
│                │  │                         │ │  for EV market[✏️🗑]│ │
│                │  │ 📊 bar chart            │ │ 📊 bar chart       │ │
│                │  │                         │ │                    │ │
│                │  └─────────────────────────┘ └────────────────────┘ │
│                │                                                     │
│                │  ┌──────────────────────────────────────────────────┐│
│                │  │ ➕ Ask AI for a new chart                        ││
│                │  │ ┌──────────────────────────────────────────────┐ ││
│                │  │ │ "Show sentiment trend for inflation last     │ ││
│                │  │ │  30 days, compared to 30 days before that"   │ ││
│                │  │ └──────────────────────────────────────────────┘ ││
│                │  │                              [Generate chart →] ││
│                │  └──────────────────────────────────────────────────┘│
└────────────────┴─────────────────────────────────────────────────────┘
```

---

# 🔄 Data flow — what user sees vs what happens behind

```
USER OPENS DASHBOARD
        │
        ▼
GET /api/articles?days=7  ──► Postgres ──► returns 247 articles
GET /api/analytics?days=7 ──► Postgres ──► returns aggregates
        │
        ▼
React renders feed + charts
        │
        │ (every 60 seconds)
        ▼
Re-fetch ──► new articles appear automatically
                                            │
                                            │
            (meanwhile, in background:)     │
        ┌──────────────────────────────────┘
        ▼
SCHEDULER fires every hour
   → reads active keywords from DB
   → runs AI agent
   → Tavily fetches articles
   → Claude summarizes
   → Inserts into articles table
        │
        ▼
Next user refresh sees the new articles ✨
```

---

# 📊 Honest scope check

| Screen | Built today? | Work to finish |
|---|---|---|
| Login / signup | ✅ Done | — |
| News feed (grid) | ✅ Done | Wire to `/api/articles` instead of agent response (4 hrs) |
| Featured article | ✅ Done | — |
| Filters | ✅ Done | — |
| Analytics page | ✅ Done | Wire to `/api/analytics` (2 hrs) |
| Keyword management | 🟡 Backend done, UI partial | Build CRUD page (1 day) |
| Scheduler page | 🟡 Backend done, no UI | Build status + settings page (1 day) |
| Article detail | ❌ Not built | Build modal/page (4 hrs) |
| Auto-refresh (live) | ❌ Not built | Add 60s polling (2 hrs) |
| Custom dashboard (AI) | ❌ Not built | **PHASE 2 — 1.5–2 weeks** |

