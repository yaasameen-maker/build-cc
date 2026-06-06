from __future__ import annotations
import os
from llm.types import ModelInfo, ProviderType

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

FREE_MODELS: dict[str, str] = {
    "qwen3_coder": "qwen/qwen3-coder:free",
    "deepseek_r1": "deepseek/deepseek-r1:free",
    "llama_70b": "meta-llama/llama-3.3-70b-instruct:free",
}

AGENT_MODEL_MAP: dict[str, str] = {
    "sonnet": FREE_MODELS["qwen3_coder"],
    "opus": FREE_MODELS["deepseek_r1"],
    "haiku": FREE_MODELS["llama_70b"],
}


class OpenRouterProvider:
    provider_type = ProviderType.OPENROUTER

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY", "")
        self.base_url = OPENROUTER_BASE_URL
        self._default_model = model or os.environ.get(
            "OPENROUTER_MODEL", FREE_MODELS["qwen3_coder"]
        )
        self._models = [
            ModelInfo(
                name=mid,
                provider=ProviderType.OPENROUTER,
                supports_tools=True,
                supports_vision=False,
                max_tokens=8192,
                context_window=1_000_000 if "qwen" in mid else 131_072,
            )
            for mid in FREE_MODELS.values()
        ]

    def get_default_model(self) -> str:
        return self._default_model

    def resolve_agent_model(self, agent_tier: str) -> str:
        return AGENT_MODEL_MAP.get(agent_tier.lower(), FREE_MODELS["qwen3_coder"])

    def list_models(self) -> list[ModelInfo]:
        return self._models
