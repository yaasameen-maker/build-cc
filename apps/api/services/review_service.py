from __future__ import annotations
from typing import Any
from supabase import Client
from services.agent_runner import run_agent
from services.agent_parser import normalize_agent_result
from services.review_jobs import new_request_id


async def review_diff(
    db: Client,
    user_id: str,
    repo_full_name: str,
    agent_name: str,
    prompt: str,
) -> dict[str, Any]:
    request_id = new_request_id()

    run_res = (
        db.table("agent_runs")
        .insert({
            "user_id": user_id,
            "repo_full_name": repo_full_name,
            "source": "manual",
            "agent_name": agent_name,
            "status": "running",
            "request_id": request_id,
        })
        .execute()
    )
    run_id: str = run_res.data[0]["id"]

    try:
        result = await run_agent(agent_name, prompt)
        findings = normalize_agent_result(result)

        if findings:
            db.table("agent_findings").insert([
                {
                    "run_id": run_id,
                    "severity": f["severity"],
                    "category": f["category"],
                    "title": f["title"],
                    "body": f["body"],
                    "file_path": f.get("file_path"),
                    "line_number": f.get("line_number"),
                }
                for f in findings
            ]).execute()

        db.table("agent_runs").update({"status": "done", "completed_at": "now()"}).eq("id", run_id).execute()

    except Exception as exc:
        db.table("agent_runs").update({"status": "failed", "completed_at": "now()"}).eq("id", run_id).execute()
        raise exc

    return {"run_id": run_id, "request_id": request_id, "findings": len(findings)}
