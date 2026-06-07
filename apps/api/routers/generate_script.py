from __future__ import annotations
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.script_generation import generate_script

router = APIRouter(prefix="/generate-script", tags=["scripts"])
limiter = Limiter(key_func=get_remote_address)


class GenerateScriptRequest(BaseModel):
    languageId: str
    prompt: str
    stack: dict


@router.post("")
@limiter.limit("10/minute")
async def generate_script_route(request: Request, body: GenerateScriptRequest):
    try:
        return await generate_script(
            language_id=body.languageId,
            prompt=body.prompt,
            stack=body.stack,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Generation error: {exc}")
