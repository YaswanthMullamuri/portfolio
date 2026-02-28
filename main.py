"""
Portfolio RAG Backend — FastAPI
Claude (Anthropic) powered. Rate-limited. Token-budget-aware.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from rag_engine import RAGEngine, _get_usage, TOKEN_BUDGET

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Yaswanth Portfolio API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],  # Restrict to your portfolio domain in production
    allow_origins=["https://portfolio-psi-seven-16.vercel.app/"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

rag = RAGEngine()


class ChatRequest(BaseModel):
    message: str
    llm: str = "claude"          # only "claude" is active; others commented out in rag_engine.py
    history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    llm_used: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/usage")
def usage_status():
    """Monitor monthly token consumption vs. budget."""
    usage = _get_usage()
    return {
        llm: {
            "used": usage.get(llm, 0),
            "budget": TOKEN_BUDGET.get(llm, "unlimited"),
            "percent_used": round(usage.get(llm, 0) / TOKEN_BUDGET[llm] * 100, 1)
            if TOKEN_BUDGET.get(llm) else "N/A"
        }
        for llm in TOKEN_BUDGET
    }


@app.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(request: Request, req: ChatRequest):
    try:
        answer, sources = await rag.query(
            question=req.message,
            history=req.history,
            llm=req.llm,
        )
        return ChatResponse(answer=answer, sources=sources, llm_used=req.llm)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
