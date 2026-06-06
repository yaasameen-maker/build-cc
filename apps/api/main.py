from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sync, scan, review

app = FastAPI(title="build-cc API", version="0.1.0")

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


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
