import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.auth.deps import current_user
from app.auth.routes import router as auth_router
from app.config import settings
from app.db import init_db
from app.models import FetchRequest, FetchResponse
from app.news.routes_articles import router as articles_router
from app.news.routes_keywords import router as keywords_router
from app.news.routes_scheduler import router as scheduler_router
from app.scheduler import shutdown_scheduler, start_scheduler
from app.services.agent import run_agent


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-5s | %(name)-18s | %(message)s",
    datefmt="%H:%M:%S",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("passlib").setLevel(logging.ERROR)
logging.getLogger("apscheduler").setLevel(logging.WARNING)

log = logging.getLogger("api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Initializing database…")
    await init_db()
    log.info("Database ready: %s", settings.database_url)
    if settings.jwt_secret == "dev-secret-change-me-in-production":
        log.warning("⚠ JWT_SECRET is the default — set a strong value in .env for production.")
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(title="AI News Monitoring API", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(keywords_router)
app.include_router(articles_router)
app.include_router(scheduler_router)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "model": settings.openrouter_model}


@app.get("/api/config")
async def app_config() -> dict:
    return {
        "model": settings.openrouter_model,
        "default_days_back": settings.news_days_back,
        "default_max_per_keyword": settings.max_articles_per_keyword,
        "default_search_depth": settings.search_depth,
        "scheduler_enabled": settings.scheduler_enabled,
        "scheduler_interval_minutes": settings.scheduler_interval_minutes,
    }


@app.post("/api/news/fetch", response_model=FetchResponse)
async def fetch_news(
    req: FetchRequest,
    user=Depends(current_user),
) -> FetchResponse:
    log.info("▶ POST /api/news/fetch  user=%s  keywords=%s", user.email, req.keywords)
    try:
        result = await run_agent(req, user_id=user.id)
        log.info(
            "✓ /api/news/fetch  returned %d articles in %.2fs",
            result.total_articles, result.elapsed_seconds,
        )
        return result
    except Exception as e:
        log.exception("✗ /api/news/fetch failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
