"""
Signal extractor — ported from SIGNAL_PATTERNS in command_center_auto_checklist.html.
Each function receives the full file path list and returns bool.
Content-based signals are applied separately after file reads.
"""
from typing import Callable

type FileList = list[str]


def _any(paths: FileList, *substrings: str) -> bool:
    return any(any(s in p for s in substrings) for p in paths)


def _exact(paths: FileList, *names: str) -> bool:
    return any(p in names or p.split("/")[-1] in names for p in paths)


SIGNAL_PATTERNS: dict[str, Callable[[FileList], bool]] = {
    "has_package_json":   lambda f: _exact(f, "package.json"),
    "has_readme":         lambda f: _exact(f, "README.md", "readme.md"),
    "has_env_example":    lambda f: _exact(f, ".env.example", ".env.template"),
    "has_cicd":           lambda f: _any(f, ".github/workflows/"),
    "has_docker":         lambda f: _exact(f, "docker-compose.yml", "docker-compose.yaml"),
    "has_dockerfile":     lambda f: _exact(f, "Dockerfile"),
    "has_db_schema":      lambda f: _exact(f, "prisma/schema.prisma") or _any(f, "/migrations/", "/alembic/"),
    "has_migrations":     lambda f: _any(f, "/migrations/", "/alembic/"),
    "has_seeds":          lambda f: _any(f, "/seeds/", "/fixtures/", "seed.sql"),
    "has_e2e":            lambda f: _any(f, "playwright.config", "cypress.config", "e2e/"),
    "has_unit_tests":     lambda f: _any(f, "/tests/", "/__tests__/", ".test.", ".spec."),
    "has_deploy_config":  lambda f: _any(f, "vercel.json", "netlify.toml", "railway.toml", "fly.toml"),
    "has_railway":        lambda f: _exact(f, "railway.toml"),
    "has_license":        lambda f: _exact(f, "LICENSE", "LICENSE.md", "LICENSE.txt"),
    "has_pwa":            lambda f: (
        _exact(f, "manifest.json", "manifest.webmanifest") and
        _any(f, "service-worker", "sw.js")
    ),
    "has_openapi":        lambda f: _any(f, "openapi.yaml", "swagger.json", "api-spec"),
    "has_otel":           lambda f: _any(f, "opentelemetry", "langfuse", "otel"),
    "has_mcp":            lambda f: _any(f, ".mcp.json", "mcp-configs/", "mcp_servers"),
    "has_tools":          lambda f: _any(f, "/tools/", "/agents/"),
    "has_scripts":        lambda f: any(
        "/scripts/" in p and (p.endswith(".py") or p.endswith(".ts")) for p in f
    ),
    "has_adapter":        lambda f: any(
        "adapter" in p and (p.endswith(".py") or p.endswith(".ts")) for p in f
    ),
    "has_prompts":        lambda f: _any(f, "/prompts/", "system_prompt", "SYSTEM.md"),
    "has_vector_db":      lambda f: _any(f, "pinecone", "chroma", "weaviate", "pgvector"),
    "has_computer_vision": lambda f: _any(f, "cv2", "opencv", "yolo", "mediapipe", "torchvision", "vision_model", "object_detection", "image_classify"),
    "has_evals":          lambda f: _any(f, "/evals/", "golden", "eval_"),
    "has_memory":         lambda f: _any(f, "honcho", "memory_", "/memory/"),
    "has_health":         lambda f: any(
        "health" in p and (p.endswith(".py") or p.endswith(".ts") or p.endswith(".js"))
        for p in f
    ),
    "has_cors":           lambda f: any(
        "cors" in p and "node_modules" not in p for p in f
    ),
    "has_auth_file":      lambda f: _any(f, "/auth/", "auth.py", "auth.ts"),
    "has_openrouter":     lambda f: False,  # set via content scan
    "has_backend_deps":   lambda f: _any(f, "requirements.txt", "pyproject.toml", "go.mod", "pom.xml", "Cargo.toml"),
    "has_monorepo":       lambda f: _any(f, "pnpm-workspace", "nx.json", "turbo.json", "lerna.json"),
    "has_supabase":       lambda f: _any(f, "supabase/", ".supabase"),
    "has_security_scan":  lambda f: False,  # set via workflow content scan
    "has_license_check":  lambda f: False,  # set via content scan
    "has_lighthouse_ci":  lambda f: _any(f, ".lighthouserc", "lighthouse-ci"),
    "has_changelog":      lambda f: _any(f, "CHANGELOG", "SESSIONS"),
    "has_cicd_deploy":    lambda f: False,  # set via workflow content scan
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
    if not content:
        return
    if not signals.get("has_openrouter"):
        signals["has_openrouter"] = "openrouter" in content or (
            "openai" in content and "baseURL" in content
        )
    if not signals.get("has_otel"):
        signals["has_otel"] = any(v in content for v in ["opentelemetry", "langfuse", "langsmith"])
    if not signals.get("has_vector_db"):
        signals["has_vector_db"] = any(v in content for v in ["pgvector", "pinecone", "chroma", "weaviate", "qdrant"])
    if not signals.get("has_cors"):
        signals["has_cors"] = "cors" in content
    if not signals.get("has_lighthouse_ci"):
        signals["has_lighthouse_ci"] = "lighthouse" in content
    if not signals.get("has_license_check"):
        signals["has_license_check"] = "license-checker" in content


def apply_python_deps(signals: dict, content: str) -> None:
    if not content:
        return
    if not signals.get("has_openrouter"):
        signals["has_openrouter"] = "openrouter" in content or "litellm" in content
    if not signals.get("has_otel"):
        signals["has_otel"] = any(v in content for v in ["opentelemetry", "langfuse", "langsmith"])
    if not signals.get("has_vector_db"):
        signals["has_vector_db"] = any(v in content for v in ["pgvector", "pinecone-client", "chromadb", "weaviate-client", "qdrant-client"])
    if not signals.get("has_memory"):
        signals["has_memory"] = "honcho" in content
    if not signals.get("has_computer_vision"):
        signals["has_computer_vision"] = any(v in content for v in [
            "opencv-python", "cv2", "ultralytics", "mediapipe",
            "torchvision", "scikit-image", "imageio", "Pillow", "pillow",
            "roboflow", "supervision", "detectron2",
        ])
    signals["has_backend_deps"] = True


def apply_workflow_content(signals: dict, content: str) -> None:
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
    sections is the combined FE + BE section list (dicts with id, items).
    Each item may have: auto (signal key), autoWarn (signal key).
    """
    auto_checks: dict[str, bool] = {}
    for sec in sections:
        for item in sec.get("items", []):
            sec_id = sec["id"]
            item_id = item["id"]
            auto_key = item.get("auto")
            warn_key = item.get("autoWarn")
            if auto_key and signals.get(auto_key):
                auto_checks[f"auto:{sec_id}:{item_id}"] = True
            elif warn_key and signals.get(warn_key):
                auto_checks[f"review:{sec_id}:{item_id}"] = True
    return auto_checks
