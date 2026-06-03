import asyncio
import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional

from services import github as gh
from services.scanner import scan_content, scan_summary, Finding

router = APIRouter(prefix="/scan", tags=["scan"])

SCANNABLE_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".go", ".rb", ".php", ".java", ".cs", ".cpp", ".c",
    ".sh", ".bash", ".env",
}

MAX_FILES = 20
MAX_FILE_BYTES = 100_000


class ScanRequest(BaseModel):
    files: list[str] = []  # explicit file paths; if empty, auto-select from tree


class FindingOut(BaseModel):
    filename: str
    line: int
    severity: str
    category: str
    message: str
    snippet: str


class ScanResponse(BaseModel):
    findings: list[FindingOut]
    summary: dict
    files_scanned: int


@router.post("/{owner}/{repo}", response_model=ScanResponse)
async def scan_repo(
    owner: str,
    repo: str,
    body: ScanRequest = ScanRequest(),
    x_github_token: Optional[str] = Header(None, alias="x-github-token"),
):
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get default branch to resolve file paths
        try:
            branch = await gh.get_default_branch(client, x_github_token, owner, repo)
        except Exception:
            raise HTTPException(status_code=404, detail="Repo not found or is private")

        # Pick files to scan
        if body.files:
            files_to_scan = body.files[:MAX_FILES]
        else:
            tree = await gh.get_file_tree(client, x_github_token, owner, repo, branch)
            files_to_scan = [
                f for f in tree
                if any(f.endswith(ext) for ext in SCANNABLE_EXTENSIONS)
                and not any(skip in f for skip in ("node_modules/", ".min.", "dist/", "build/", "__pycache__/", ".pyc"))
            ][:MAX_FILES]

        if not files_to_scan:
            return ScanResponse(findings=[], summary=scan_summary([]), files_scanned=0)

        # Fetch file contents in parallel
        contents = await asyncio.gather(*[
            gh.read_file(client, x_github_token, owner, repo, f, MAX_FILE_BYTES)
            for f in files_to_scan
        ])

        # Run scanner over each file
        all_findings: list[Finding] = []
        for filename, content in zip(files_to_scan, contents):
            if content:
                all_findings.extend(scan_content(filename, content))

        # Sort by severity
        order = {"error": 0, "warning": 1, "info": 2}
        all_findings.sort(key=lambda f: (order.get(f.severity, 3), f.filename, f.line))

        return ScanResponse(
            findings=[FindingOut(**f.__dict__) for f in all_findings[:200]],
            summary=scan_summary(all_findings),
            files_scanned=len(files_to_scan),
        )
