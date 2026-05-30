import httpx
from typing import Optional

BASE = "https://api.github.com"
RAW = "https://raw.githubusercontent.com"


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}


async def get_default_branch(client: httpx.AsyncClient, token: str, owner: str, repo: str) -> str:
    r = await client.get(f"{BASE}/repos/{owner}/{repo}", headers=_headers(token))
    r.raise_for_status()
    return r.json().get("default_branch", "main")


async def get_file_tree(client: httpx.AsyncClient, token: str, owner: str, repo: str, branch: str) -> list[str]:
    r = await client.get(
        f"{BASE}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
        headers=_headers(token),
    )
    if not r.is_success:
        return []
    data = r.json()
    return [f["path"] for f in data.get("tree", []) if f.get("type") == "blob"]


async def get_commits(client: httpx.AsyncClient, token: str, owner: str, repo: str) -> list:
    r = await client.get(f"{BASE}/repos/{owner}/{repo}/commits?per_page=15", headers=_headers(token))
    return r.json() if r.is_success else []


async def get_prs(client: httpx.AsyncClient, token: str, owner: str, repo: str) -> list:
    r = await client.get(f"{BASE}/repos/{owner}/{repo}/pulls?state=open&per_page=5", headers=_headers(token))
    return r.json() if r.is_success else []


async def get_issues(client: httpx.AsyncClient, token: str, owner: str, repo: str) -> list:
    r = await client.get(f"{BASE}/repos/{owner}/{repo}/issues?state=open&per_page=5", headers=_headers(token))
    if not r.is_success:
        return []
    return [i for i in r.json() if "pull_request" not in i]


async def read_file(client: httpx.AsyncClient, token: str, owner: str, repo: str, path: str, max_bytes: int = 50_000) -> Optional[str]:
    r = await client.get(f"{RAW}/{owner}/{repo}/HEAD/{path}", headers=_headers(token))
    if not r.is_success:
        return None
    return r.text[:max_bytes]
