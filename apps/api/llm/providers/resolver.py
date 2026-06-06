from __future__ import annotations
import os
from llm.types import ProviderType
from llm.providers.openrouter import OpenRouterProvider


_PROVIDER_MAP = {
    ProviderType.OPENROUTER: OpenRouterProvider,
}


def get_provider(provider_type: ProviderType | None = None) -> OpenRouterProvider:
    env_val = os.environ.get("LLM_PROVIDER", ProviderType.OPENROUTER.value)
    resolved = provider_type or ProviderType(env_val)
    cls = _PROVIDER_MAP.get(resolved)
    if cls is None:
        raise ValueError(f"Unknown provider: {resolved}")
    return cls()
