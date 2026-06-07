from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from routers import sync, scan, review, generate_script

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="build-cc API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://build-cc.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sync.router)
app.include_router(scan.router)
app.include_router(review.router)
app.include_router(generate_script.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
