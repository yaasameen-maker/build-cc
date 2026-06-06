from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import get_db
from services.review_service import review_diff

router = APIRouter(prefix="/review", tags=["review"])


class ReviewRequest(BaseModel):
    user_id: str
    repo_full_name: str
    agent_name: str
    prompt: str


@router.post("")
async def create_review(body: ReviewRequest):
    db = get_db()
    try:
        result = await review_diff(
            db=db,
            user_id=body.user_id,
            repo_full_name=body.repo_full_name,
            agent_name=body.agent_name,
            prompt=body.prompt,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent error: {exc}")
    return result
