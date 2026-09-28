from typing import Literal
from pydantic import BaseModel, Field


Category = Literal[
    "Business",
    "Technology",
    "Politics",
    "Sports",
    "Entertainment",
    "Science",
    "World",
    "Health",
    "Finance",
    "Other",
]

Sentiment = Literal["positive", "neutral", "negative"]


class FetchRequest(BaseModel):
    keywords: list[str] = Field(..., min_length=1, max_length=10)
    max_per_keyword: int | None = Field(default=None, ge=1, le=20)
    days_back: int | None = Field(default=None, ge=1, le=30)
    search_depth: Literal["basic", "advanced"] | None = None


class ArticleSummary(BaseModel):
    summary: str
    key_points: list[str]
    category: Category
    sentiment: Sentiment
    importance: int = Field(..., ge=1, le=10)
    relevance: int = Field(default=10, ge=0, le=10)
    tags: list[str]


class Article(BaseModel):
    id: str
    keyword: str
    title: str
    url: str
    source: str
    published_at: str | None
    image_url: str | None
    raw_snippet: str
    summary: ArticleSummary | None = None
    error: str | None = None


class AgentTraceEvent(BaseModel):
    stage: Literal["plan", "search", "evaluate", "summarize", "filter", "rank"]
    keyword: str | None = None
    detail: dict = Field(default_factory=dict)


class FetchResponse(BaseModel):
    keywords: list[str]
    total_articles: int
    articles: list[Article]
    elapsed_seconds: float
    stats: dict = Field(default_factory=dict)
    trace: list[AgentTraceEvent] = Field(default_factory=list)
