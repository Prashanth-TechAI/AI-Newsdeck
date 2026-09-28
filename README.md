# NewsPulse — AI News Dashboard (MVP)

Keyword-driven news dashboard. Tavily fetches articles, Claude (via OpenRouter)
summarizes each one into category + key points + sentiment + importance,
React renders them in your chosen layout (Grid / Category / Timeline / Source).

## Stack

- **Backend:** FastAPI + uvicorn (Python 3.10+)
- **Agent:** **LangGraph** state machine (6 nodes: prepare → search → dedupe → summarize → filter → rank)
- **Frontend:** React 18 + Vite + TypeScript + Tailwind (light theme)
- **News:** Tavily `/search` with `topic="news"` (search + extract in one call)
- **LLM:** Claude Sonnet 4.6 via OpenRouter (OpenAI-compatible SDK)
- **Reliability:** tenacity retries on LLM parse/network errors; relevance filtering

## Project layout

```
.
├── backend/             FastAPI app
│   ├── app/
│   │   ├── main.py            FastAPI routes + CORS
│   │   ├── config.py          env loader (reads ../.env)
│   │   ├── models.py          Pydantic schemas
│   │   └── services/
│   │       ├── news_service.py    Tavily client
│   │       ├── llm_service.py     Claude/OpenRouter client + prompt
│   │       └── agent.py           orchestrator: search -> summarize
│   ├── requirements.txt
│   └── run.sh
├── ui/                  React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/  Sidebar, Dashboard, ArticleCard
│   │   ├── api/         fetch client (proxies /api -> backend)
│   │   └── types.ts
│   └── package.json
├── .env                 (gitignored) — your API keys
└── .env.example
```

## 1. Configure keys

Edit `.env` at the repo root:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-sonnet-4.6
TAVILY_API_KEY=tvly-...
```

## 2. Run the backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Or one-liner: `./run.sh`

Health check: <http://localhost:8000/api/health>

## 3. Run the frontend

In a second terminal:

```bash
cd ui
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` to
`http://localhost:8000` so CORS is not in the way.

## 4. Use it

1. Add 1–10 keywords in the sidebar (Enter to add).
2. Adjust max-articles-per-keyword (3–15), days back (1–14), search depth.
3. Pick a layout: **Grid**, **By Category**, **Timeline**, **By Source**.
4. Click **Run agent**.

Behind the scenes — **LangGraph pipeline**:

```
START → prepare → search → dedupe → summarize → filter → rank → END
```

- **prepare**:   resolve config (max_per, days_back, depth) and init state
- **search**:    Tavily searches each keyword *in parallel* (`topic=news`, full body)
- **dedupe**:    drop duplicate URLs across keywords (hash-based)
- **summarize**: Claude summaries *in parallel* (concurrency 6) with retries; each returns
                 `{summary, key_points, category, sentiment, importance, relevance, tags}`
- **filter**:    drop articles with `relevance < 4` (off-topic noise)
- **rank**:      sort by `importance × 10 + relevance` desc, then date desc

The LLM prompt is a strict JSON-output system prompt with category taxonomy,
importance rubric (1-10), relevance rubric (0-10), sentiment definition, and
8 hard rules. See `backend/app/services/llm_service.py`.

## Endpoints

- `GET /api/health` — status + active model
- `GET /api/config` — defaults from `.env`
- `POST /api/news/fetch` — body: `{ keywords, max_per_keyword?, days_back?, search_depth? }`

## Notes / next steps

- The Tavily free tier gives 1000 searches/month. A 3-keyword run = 3 searches.
- Summarization cost: ~$0.005–0.01 per article with Sonnet 4.6.
- To swap to NewsAPI.ai later, replace `services/news_service.py` only.
- To persist results, add SQLAlchemy + a `summaries` table; the article `id` is
  already a stable URL hash.
