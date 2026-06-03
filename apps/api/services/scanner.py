import re
from dataclasses import dataclass, field
from typing import Optional

SEVERITY_ERROR = "error"
SEVERITY_WARN = "warning"
SEVERITY_INFO = "info"


@dataclass
class Finding:
    filename: str
    line: int
    severity: str
    category: str
    message: str
    snippet: str


# Patterns run against each line of a file
LINE_PATTERNS = [
    # Security — hardcoded secrets
    (re.compile(r'(?i)(password|passwd|secret|api_key|apikey|auth_token|access_token)\s*=\s*["\'][^"\']{6,}["\']'), SEVERITY_ERROR, "security", "Possible hardcoded secret"),
    (re.compile(r'(?i)bearer\s+[a-z0-9\-_.]{20,}', re.IGNORECASE), SEVERITY_ERROR, "security", "Possible hardcoded Bearer token"),
    (re.compile(r'["\'](?:sk|pk|rk)[-_][a-z0-9]{20,}["\']', re.IGNORECASE), SEVERITY_ERROR, "security", "Possible API key literal"),

    # Quality — debug leftovers
    (re.compile(r'\bconsole\.log\s*\('), SEVERITY_WARN, "quality", "console.log left in code"),
    (re.compile(r'\bprint\s*\((?!.*#\s*noqa)'), SEVERITY_INFO, "quality", "print() statement (check if intentional)"),
    (re.compile(r'\bpdb\.set_trace\(\)|\bbreakpoint\(\)'), SEVERITY_ERROR, "quality", "Debugger breakpoint left in code"),

    # Code smell
    (re.compile(r'#\s*(TODO|FIXME|HACK|XXX)\b'), SEVERITY_INFO, "smell", "TODO/FIXME/HACK comment"),
    (re.compile(r'#\s*noqa\b'), SEVERITY_INFO, "smell", "Lint suppression (noqa)"),
    (re.compile(r'//\s*eslint-disable'), SEVERITY_INFO, "smell", "ESLint disable comment"),

    # Unsafe patterns
    (re.compile(r'\beval\s*\('), SEVERITY_ERROR, "security", "eval() usage — potential code injection"),
    (re.compile(r'\bexec\s*\('), SEVERITY_WARN, "security", "exec() usage — review carefully"),
    (re.compile(r'dangerouslySetInnerHTML'), SEVERITY_WARN, "security", "dangerouslySetInnerHTML — XSS risk if unsanitized"),
]


def scan_content(filename: str, content: str, max_findings: int = 50) -> list[Finding]:
    findings: list[Finding] = []
    lines = content.splitlines()

    # File-level check: complexity proxy
    if len(lines) > 500:
        findings.append(Finding(
            filename=filename, line=1,
            severity=SEVERITY_INFO, category="complexity",
            message=f"File is {len(lines)} lines — consider splitting",
            snippet=f"({len(lines)} total lines)",
        ))

    for i, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#") and len(stripped) < 3:
            continue
        for pattern, severity, category, message in LINE_PATTERNS:
            if pattern.search(line):
                snippet = line.strip()[:120]
                findings.append(Finding(
                    filename=filename, line=i,
                    severity=severity, category=category,
                    message=message, snippet=snippet,
                ))
                break  # one finding per line max
        if len(findings) >= max_findings:
            break

    return findings


def scan_summary(all_findings: list[Finding]) -> dict:
    errors = sum(1 for f in all_findings if f.severity == SEVERITY_ERROR)
    warnings = sum(1 for f in all_findings if f.severity == SEVERITY_WARN)
    infos = sum(1 for f in all_findings if f.severity == SEVERITY_INFO)
    categories: dict[str, int] = {}
    for f in all_findings:
        categories[f.category] = categories.get(f.category, 0) + 1

    score = max(0, 100 - errors * 15 - warnings * 5 - infos * 1)
    return {
        "total": len(all_findings),
        "errors": errors,
        "warnings": warnings,
        "info": infos,
        "score": score,
        "categories": categories,
    }
