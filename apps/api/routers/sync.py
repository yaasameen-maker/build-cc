import asyncio
import httpx
from fastapi import APIRouter, Header, HTTPException
from typing import Optional

from models.build import SyncRequest, SyncResponse, GHData
from services import github as gh
from services.signals import (
    run_signals,
    apply_package_json,
    apply_python_deps,
    apply_workflow_content,
    build_auto_checks,
)
from data.sections import ALL_SECTIONS

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/{owner}/{repo}", response_model=SyncResponse)
async def sync_repo(
    owner: str,
    repo: str,
    body: SyncRequest = SyncRequest(),
    x_github_token: str = Header(..., alias="x-github-token"),
):
    async with httpx.AsyncClient(timeout=20.0) as client:
        # 1. default branch
        try:
            branch = body.branch or await gh.get_default_branch(client, x_github_token, owner, repo)
        except Exception:
            raise HTTPException(status_code=404, detail="Repo not found or token lacks access")

        # 2. parallel: file tree + commits + PRs + issues
        tree_task = gh.get_file_tree(client, x_github_token, owner, repo, branch)
        commits_task = gh.get_commits(client, x_github_token, owner, repo)
        prs_task = gh.get_prs(client, x_github_token, owner, repo)
        issues_task = gh.get_issues(client, x_github_token, owner, repo)

        file_tree, commits, prs, issues = await asyncio.gather(
            tree_task, commits_task, prs_task, issues_task
        )

        # 3. content reads
        pkg_content = ""
        py_content = ""
        workflow_content = ""

        content_tasks: list = []
        if "package.json" in file_tree:
            content_tasks.append(gh.read_file(client, x_github_token, owner, repo, "package.json"))
        else:
            content_tasks.append(asyncio.sleep(0, result=None))

        py_file = next((f for f in ["requirements.txt", "pyproject.toml"] if f in file_tree), None)
        if py_file:
            content_tasks.append(gh.read_file(client, x_github_token, owner, repo, py_file))
        else:
            content_tasks.append(asyncio.sleep(0, result=None))

        wf_files = [f for f in file_tree if f.startswith(".github/workflows/") and f.endswith((".yml", ".yaml"))][:3]
        if wf_files:
            wf_reads = await asyncio.gather(*[gh.read_file(client, x_github_token, owner, repo, f, 20_000) for f in wf_files])
            workflow_content = "\n".join(t for t in wf_reads if t)
            content_tasks.append(asyncio.sleep(0, result=None))
        else:
            content_tasks.append(asyncio.sleep(0, result=None))

        results = await asyncio.gather(*content_tasks[:2])
        pkg_content = results[0] or ""
        py_content = results[1] or ""

        # 4. run signals
        signals = run_signals(file_tree)
        apply_package_json(signals, pkg_content)
        apply_python_deps(signals, py_content)
        apply_workflow_content(signals, workflow_content)

        # 5. build auto_checks
        auto_checks = build_auto_checks(signals, ALL_SECTIONS)

        return SyncResponse(
            signals=signals,
            auto_checks=auto_checks,
            gh_data=GHData(commits=commits[:15], prs=prs[:5], issues=issues[:5]),
            file_count=len(file_tree),
        )
