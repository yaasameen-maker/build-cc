from __future__ import annotations
from typing import Any


def normalize_agent_result(result: dict[str, Any]) -> list[dict[str, Any]]:
    findings = result.get("findings", [])
    normalized = []

    for f in findings:
        normalized.append({
            "severity": f.get("severity", "warning"),
            "category": f.get("category", "review"),
            "title": f.get("title", "Untitled finding"),
            "body": f.get("body", ""),
            "file_path": f.get("file_path"),
            "line_number": f.get("line_number"),
        })

    return normalized
