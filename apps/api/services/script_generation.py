from __future__ import annotations
from typing import Any
from services.agent_runner import run_agent

_SYSTEM_PROMPT = """\
You are a script generator.
Return JSON only with this shape:
{
  "filename": "string",
  "content": "string",
  "notes": ["string"]
}
Do not return markdown, code fences, or any extra text.\
"""


async def generate_script(language_id: str, prompt: str, stack: dict) -> dict[str, Any]:
    stack_summary = "\n".join(
        f"{key}: {', '.join(value) if isinstance(value, list) else value}"
        for key, value in stack.items()
        if value
    )

    full_prompt = (
        f"Language: {language_id}\n"
        f"Stack:\n{stack_summary}\n"
        f"Task: {prompt}"
    )

    return await run_agent("script-generator", full_prompt, system_prompt=_SYSTEM_PROMPT)
