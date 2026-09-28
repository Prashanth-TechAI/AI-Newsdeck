from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


def _normalize_db_url(url: str) -> str:
    """Ensure the URL uses an async driver SQLAlchemy can recognise."""
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1).replace(
            "postgresql://", "postgresql+asyncpg://", 1
        )
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openrouter_api_key: str
    openrouter_model: str = "anthropic/claude-sonnet-4.6"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    tavily_api_key: str
    tavily_base_url: str = "https://api.tavily.com"

    max_articles_per_keyword: int = 8
    search_depth: str = "advanced"
    news_days_back: int = 5

    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:5174"
    request_timeout_seconds: float = 60.0

    summarize_concurrency: int = 6
    relevance_threshold: int = 4
    llm_max_retries: int = 2
    llm_temperature: float = 0.2

    # Auth / DB
    database_url: str = f"sqlite+aiosqlite:///{ROOT_DIR / 'app.db'}"
    jwt_secret: str = "dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expires_hours: int = 24 * 7
    password_reset_expires_minutes: int = 60

    # Redis cache (optional — gracefully falls back if unreachable)
    redis_url: str | None = None
    cache_ttl_seconds: int = 60 * 60 * 24 * 3  # 3 days for article summaries

    # Scheduler
    scheduler_enabled: bool = True
    scheduler_interval_minutes: int = 60
    scheduler_max_keywords_per_run: int = 20
    scheduler_run_on_startup: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
settings.database_url = _normalize_db_url(settings.database_url)
