from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum


class ProviderType(str, Enum):
    OPENROUTER = "openrouter"


@dataclass
class ModelInfo:
    name: str
    provider: ProviderType
    supports_tools: bool = False
    supports_vision: bool = False
    max_tokens: int = 4096
    context_window: int = 131072
