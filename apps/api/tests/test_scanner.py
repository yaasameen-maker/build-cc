import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.scanner import scan_content, scan_summary
from services.signals import run_signals


def test_detects_hardcoded_secret():
    findings = scan_content('test.py', 'api_key = "sk-abc123456789"')
    assert any(f.category == 'security' for f in findings)


def test_detects_console_log():
    findings = scan_content('app.ts', 'console.log(userToken)')
    assert any(f.severity == 'warning' for f in findings)


def test_clean_file_has_no_findings():
    findings = scan_content('clean.py', 'x = 1 + 1\n')
    assert len(findings) == 0


def test_score_decreases_with_errors():
    findings = scan_content('bad.py', 'password = "hunter2"\n')
    summary = scan_summary(findings)
    assert summary['score'] < 100


def test_signals_detects_package_json():
    signals = run_signals(['next.config.ts', 'package.json'])
    assert signals.get('has_package_json') is True


def test_signals_detects_cicd():
    signals = run_signals(['.github/workflows/ci.yml', 'package.json'])
    assert signals.get('has_cicd') is True
