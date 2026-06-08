from pydantic import BaseModel
from typing import Optional


class SyncRequest(BaseModel):
    branch: Optional[str] = None


class GHData(BaseModel):
    commits: list = []
    prs: list = []
    issues: list = []


class SyncResponse(BaseModel):
    signals: dict[str, bool]
    auto_checks: dict[str, bool]
    gh_data: GHData
    file_count: int
    deploy_urls: dict[str, str] = {}
