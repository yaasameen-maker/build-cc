from __future__ import annotations
import os
import json
import httpx
from typing import Any

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

MODEL_MAP: dict[str, str] = {
    "code-reviewer": "qwen/qwen3-coder:free",
    "typescript-reviewer": "qwen/qwen3-coder:free",
    "react-reviewer": "qwen/qwen3-coder:free",
    "security-reviewer": "qwen/qwen3-coder:free",
    "planner": "deepseek/deepseek-r1:free",
    "doc-updater": "meta-llama/llama-3.3-70b-instruct:free",
}

_SYSTEM_PROMPT = """\
You are a code review agent.
Return JSON only with this shape:
{
  "summary": "string",
  "findings": [
    {
      "severity": "low|medium|high|warning",
      "category": "review|security|types|react|tests|docs",
      "title": "short string",
      "body": "full explanation",
      "file_path": "optional string",
      "line_number": 0
    }
  ]
}
Do not return markdown.\
"""


async def run_agent(agent_name: str, prompt: str) -> dict[str, Any]:
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set")

    model = MODEL_MAP.get(agent_name, "qwen/qwen3-coder:free")
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=90) as client:
        res = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        res.raise_for_status()
        data = res.json()
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)
