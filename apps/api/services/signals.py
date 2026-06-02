"""
Signal extractor — detects technologies, APIs, and libraries from a repo's file tree and dependency files.
File-tree signals run first; content-based signals override/extend via apply_* functions.
"""
from typing import Callable

type FileList = list[str]


def _any(paths: FileList, *substrings: str) -> bool:
    return any(any(s in p for s in substrings) for p in paths)


def _exact(paths: FileList, *names: str) -> bool:
    return any(p in names or p.split("/")[-1] in names for p in paths)


SIGNAL_PATTERNS: dict[str, Callable[[FileList], bool]] = {
    # ── Project structure ──────────────────────────────────────────────────
    "has_package_json":    lambda f: _exact(f, "package.json"),
    "has_readme":          lambda f: _exact(f, "README.md", "readme.md"),
    "has_env_example":     lambda f: _exact(f, ".env.example", ".env.template"),
    "has_monorepo":        lambda f: _any(f, "pnpm-workspace", "nx.json", "turbo.json", "lerna.json"),
    "has_license":         lambda f: _exact(f, "LICENSE", "LICENSE.md", "LICENSE.txt"),
    "has_changelog":       lambda f: _any(f, "CHANGELOG", "SESSIONS"),

    # ── Infrastructure & deployment ────────────────────────────────────────
    "has_cicd":            lambda f: _any(f, ".github/workflows/"),
    "has_docker":          lambda f: _exact(f, "docker-compose.yml", "docker-compose.yaml"),
    "has_dockerfile":      lambda f: _exact(f, "Dockerfile"),
    "has_deploy_config":   lambda f: _any(f, "vercel.json", "netlify.toml", "railway.toml", "fly.toml"),
    "has_railway":         lambda f: _exact(f, "railway.toml"),
    "has_supabase":        lambda f: _any(f, "supabase/", ".supabase"),
    "has_lighthouse_ci":   lambda f: _any(f, ".lighthouserc", "lighthouse-ci"),

    # ── Database & data ────────────────────────────────────────────────────
    "has_db_schema":       lambda f: _exact(f, "prisma/schema.prisma") or _any(f, "/migrations/", "/alembic/"),
    "has_migrations":      lambda f: _any(f, "/migrations/", "/alembic/"),
    "has_seeds":           lambda f: _any(f, "/seeds/", "/fixtures/", "seed.sql"),
    "has_vector_db":       lambda f: _any(f, "pinecone", "chroma", "weaviate", "pgvector"),

    # ── Testing ────────────────────────────────────────────────────────────
    "has_e2e":             lambda f: _any(f, "playwright.config", "cypress.config", "e2e/"),
    "has_unit_tests":      lambda f: _any(f, "/tests/", "/__tests__/", ".test.", ".spec."),
    "has_evals":           lambda f: _any(f, "/evals/", "golden", "eval_"),

    # ── API & auth ─────────────────────────────────────────────────────────
    "has_openapi":         lambda f: _any(f, "openapi.yaml", "swagger.json", "api-spec"),
    "has_auth_file":       lambda f: _any(f, "/auth/", "auth.py", "auth.ts"),
    "has_cors":            lambda f: any("cors" in p and "node_modules" not in p for p in f),
    "has_health":          lambda f: any(
        "health" in p and (p.endswith(".py") or p.endswith(".ts") or p.endswith(".js")) for p in f
    ),
    "has_api_routes":      lambda f: (
        _any(f, "app/api/", "pages/api/", "/routers/", "/routes/")
        or _exact(f, "routes.py", "routes.ts", "router.py", "router.ts", "views.py")
    ),

    # ── AI / LLM (specific APIs) ───────────────────────────────────────────
    "has_openai":          lambda f: False,   # set via content scan
    "has_anthropic":       lambda f: False,   # set via content scan
    "has_google_ai":       lambda f: False,   # set via content scan
    "has_cohere":          lambda f: False,   # set via content scan
    "has_replicate":       lambda f: False,   # set via content scan
    "has_openrouter":      lambda f: False,   # set via content scan

    # ── AI orchestration ───────────────────────────────────────────────────
    "has_langchain":       lambda f: _any(f, "langchain", "langgraph"),
    "has_llamaindex":      lambda f: _any(f, "llama_index", "llamaindex", "llama-index"),
    "has_memory":          lambda f: _any(f, "honcho", "memory_", "/memory/"),
    "has_mcp":             lambda f: _any(f, ".mcp.json", "mcp-configs/", "mcp_servers"),
    "has_tools":           lambda f: _any(f, "/tools/", "/agents/"),
    "has_prompts":         lambda f: _any(f, "/prompts/", "system_prompt", "SYSTEM.md"),
    "has_adapter":         lambda f: any(
        "adapter" in p and (p.endswith(".py") or p.endswith(".ts")) for p in f
    ),

    # ── Computer Vision (specific) ─────────────────────────────────────────
    "has_computer_vision": lambda f: _any(f, "cv2", "opencv", "yolo", "mediapipe", "torchvision",
                                           "vision_model", "object_detection", "image_classify"),
    "has_opencv":          lambda f: False,   # set via content scan
    "has_yolo":            lambda f: False,   # set via content scan
    "has_mediapipe":       lambda f: False,   # set via content scan

    # ── ML frameworks ──────────────────────────────────────────────────────
    "has_pytorch":         lambda f: False,   # set via content scan
    "has_tensorflow":      lambda f: False,   # set via content scan

    # ── Backend frameworks ─────────────────────────────────────────────────
    "has_fastapi":         lambda f: _any(f, "fastapi", "main.py") and _any(f, "requirements.txt", "pyproject.toml"),
    "has_flask":           lambda f: False,   # set via content scan
    "has_django":          lambda f: _any(f, "manage.py", "django"),
    "has_express":         lambda f: False,   # set via content scan
    "has_nextjs":          lambda f: _exact(f, "next.config.ts", "next.config.js", "next.config.mjs"),

    # ── Observability ──────────────────────────────────────────────────────
    "has_otel":            lambda f: _any(f, "opentelemetry", "langfuse", "otel"),

    # ── Web / PWA ──────────────────────────────────────────────────────────
    "has_pwa":             lambda f: (
        _exact(f, "manifest.json", "manifest.webmanifest") and _any(f, "service-worker", "sw.js")
    ),

    # ── Misc ───────────────────────────────────────────────────────────────
    "has_backend_deps":    lambda f: _any(f, "requirements.txt", "pyproject.toml", "go.mod", "pom.xml", "Cargo.toml"),
    "has_scripts":         lambda f: any(
        "/scripts/" in p and (p.endswith(".py") or p.endswith(".ts")) for p in f
    ),
    "has_security_scan":   lambda f: False,   # set via workflow content scan
    "has_license_check":   lambda f: False,   # set via content scan
    "has_cicd_deploy":     lambda f: False,   # set via workflow content scan
}


def run_signals(file_tree: list[str]) -> dict[str, bool]:
    signals: dict[str, bool] = {}
    for key, fn in SIGNAL_PATTERNS.items():
        try:
            signals[key] = fn(file_tree)
        except Exception:
            signals[key] = False
    return signals


def apply_package_json(signals: dict, content: str) -> None:
    """Detect npm/JS dependencies from package.json content."""
    if not content:
        return
    c = content.lower()

    # AI APIs
    if not signals.get("has_openai"):
        signals["has_openai"] = '"openai"' in content or "'openai'" in content
    if not signals.get("has_anthropic"):
        signals["has_anthropic"] = "@anthropic-ai" in content or '"anthropic"' in content
    if not signals.get("has_google_ai"):
        signals["has_google_ai"] = any(v in content for v in ["@google/generative-ai", "google-generativeai", "@google-ai"])
    if not signals.get("has_cohere"):
        signals["has_cohere"] = '"cohere-ai"' in content or '"cohere"' in content
    if not signals.get("has_replicate"):
        signals["has_replicate"] = '"replicate"' in content
    if not signals.get("has_openrouter"):
        signals["has_openrouter"] = "openrouter" in c or ("openai" in c and "baseurl" in c)

    # AI orchestration
    if not signals.get("has_langchain"):
        signals["has_langchain"] = "langchain" in c or "langgraph" in c
    if not signals.get("has_llamaindex"):
        signals["has_llamaindex"] = "llamaindex" in c or "llama-index" in c

    # Backend frameworks
    if not signals.get("has_express"):
        signals["has_express"] = '"express"' in content

    # Observability
    if not signals.get("has_otel"):
        signals["has_otel"] = any(v in c for v in ["opentelemetry", "langfuse", "langsmith"])

    # Database / vector
    if not signals.get("has_vector_db"):
        signals["has_vector_db"] = any(v in c for v in ["pgvector", "pinecone", "chroma", "weaviate", "qdrant"])

    # Misc
    if not signals.get("has_cors"):
        signals["has_cors"] = "cors" in c
    if not signals.get("has_lighthouse_ci"):
        signals["has_lighthouse_ci"] = "lighthouse" in c
    if not signals.get("has_license_check"):
        signals["has_license_check"] = "license-checker" in c


def apply_python_deps(signals: dict, content: str) -> None:
    """Detect pip/Python dependencies from requirements.txt or pyproject.toml content."""
    if not content:
        return
    c = content.lower()

    # AI APIs (specific)
    if not signals.get("has_openai"):
        signals["has_openai"] = "openai" in c and "openrouter" not in c
    if not signals.get("has_anthropic"):
        signals["has_anthropic"] = "anthropic" in c
    if not signals.get("has_google_ai"):
        signals["has_google_ai"] = any(v in c for v in ["google-generativeai", "google-ai-generativelanguage", "gemini"])
    if not signals.get("has_cohere"):
        signals["has_cohere"] = "cohere" in c
    if not signals.get("has_replicate"):
        signals["has_replicate"] = "replicate" in c
    if not signals.get("has_openrouter"):
        signals["has_openrouter"] = "openrouter" in c or "litellm" in c

    # AI orchestration
    if not signals.get("has_langchain"):
        signals["has_langchain"] = "langchain" in c or "langgraph" in c
    if not signals.get("has_llamaindex"):
        signals["has_llamaindex"] = any(v in c for v in ["llama-index", "llama_index", "llamaindex"])

    # ML frameworks
    if not signals.get("has_pytorch"):
        signals["has_pytorch"] = any(v in c for v in ["torch", "pytorch", "torchvision", "torchaudio"])
    if not signals.get("has_tensorflow"):
        signals["has_tensorflow"] = any(v in c for v in ["tensorflow", "keras", "tf-"])

    # Computer Vision (specific libs)
    if not signals.get("has_opencv"):
        signals["has_opencv"] = any(v in c for v in ["opencv-python", "opencv-contrib", "cv2"])
    if not signals.get("has_yolo"):
        signals["has_yolo"] = any(v in c for v in ["ultralytics", "yolov5", "yolov8"])
    if not signals.get("has_mediapipe"):
        signals["has_mediapipe"] = "mediapipe" in c
    if not signals.get("has_computer_vision"):
        signals["has_computer_vision"] = any(v in c for v in [
            "opencv-python", "ultralytics", "mediapipe", "torchvision",
            "scikit-image", "imageio", "pillow", "roboflow", "supervision",
            "detectron2", "mmdetection", "timm",
        ])

    # Backend frameworks
    if not signals.get("has_fastapi"):
        signals["has_fastapi"] = "fastapi" in c
    if not signals.get("has_flask"):
        signals["has_flask"] = "flask" in c
    if not signals.get("has_django"):
        signals["has_django"] = "django" in c

    # Observability / memory / vector
    if not signals.get("has_otel"):
        signals["has_otel"] = any(v in c for v in ["opentelemetry", "langfuse", "langsmith"])
    if not signals.get("has_memory"):
        signals["has_memory"] = "honcho" in c
    if not signals.get("has_vector_db"):
        signals["has_vector_db"] = any(v in c for v in [
            "pgvector", "pinecone-client", "chromadb", "weaviate-client",
            "qdrant-client", "faiss", "annoy", "milvus",
        ])

    signals["has_backend_deps"] = True


def apply_workflow_content(signals: dict, content: str) -> None:
    """Detect patterns in CI workflow YAML content."""
    if not content:
        return
    if not signals.get("has_security_scan"):
        signals["has_security_scan"] = any(v in content for v in ["trivy", "snyk", "dependabot", "semgrep"])
    if not signals.get("has_e2e"):
        signals["has_e2e"] = any(v in content.lower() for v in ["playwright", "cypress"])
    if not signals.get("has_lighthouse_ci"):
        signals["has_lighthouse_ci"] = "lighthouse" in content
    if not signals.get("has_license_check"):
        signals["has_license_check"] = any(v in content for v in ["license-checker", "pip-licenses"])
    import re
    signals["has_cicd_deploy"] = bool(re.search(r"deploy|release|publish", content, re.IGNORECASE))


def build_auto_checks(signals: dict, sections: list[dict]) -> dict[str, bool]:
    """
    Apply signal results to checklist items.
    Returns auto_checks dict with keys like 'auto:fe-prd:1' and 'review:fe-ux:7'.
    """
    auto_checks: dict[str, bool] = {}
    for sec in sections:
        for item in sec.get("items", []):
            sec_id = sec["id"]
            item_id = item["id"]
            auto_key = item.get("auto")
            warn_key = item.get("auto_warn")
            if auto_key and signals.get(auto_key):
                auto_checks[f"auto:{sec_id}:{item_id}"] = True
            elif warn_key and signals.get(warn_key):
                auto_checks[f"review:{sec_id}:{item_id}"] = True
    return auto_checks
