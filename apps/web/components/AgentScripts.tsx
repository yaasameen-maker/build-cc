'use client'

import { useState } from 'react'
import type { ProjectStack } from '@/lib/project-stack'
import { ScriptGeneratorPanel } from '@/components/scripts/ScriptGeneratorPanel'

type ScriptsView = 'library' | 'generator'

const AGENTS = [
  {
    name: 'morning_briefing_agent.py',
    desc: 'Slack briefing from GitHub — commits, PRs, issues on a schedule.',
    tags: ['slack', 'github'],
    code: `#!/usr/bin/env python3
"""Morning Briefing Agent
Usage: python morning_briefing_agent.py --repo owner/repo
Env:  GITHUB_PAT, SLACK_WEBHOOK"""
import os, argparse, requests
from datetime import datetime, timedelta, timezone

def run(repo, pat, webhook, days=1):
    h = {"Authorization": f"Bearer {pat}", "Accept": "application/vnd.github+json"}
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    b = f"https://api.github.com/repos/{repo}"
    commits = requests.get(f"{b}/commits?since={since}&per_page=10", headers=h).json()
    prs = requests.get(f"{b}/pulls?state=open&per_page=5", headers=h).json()
    issues = [i for i in requests.get(f"{b}/issues?state=open&per_page=5", headers=h).json() if "pull_request" not in i]
    lines = [f"*Briefing — {repo} — {datetime.now().strftime('%a %b %-d')}*", "",
             f":hammer: *{len(commits)} commit(s)*"]
    for c in commits[:5]:
        lines.append(f"  \`{c['sha'][:7]}\` {c['commit']['message'].split(chr(10))[0][:70]}")
    lines += [f":arrow_heading_up: *{len(prs)} open PR(s)*"]
    for p in prs[:3]: lines.append(f"  #{p['number']} {p['title'][:60]}")
    text = "\\n".join(lines)
    print(text)
    if webhook: requests.post(webhook, json={"text": text})

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--repo", required=True)
    a = p.parse_args()
    run(a.repo, os.environ["GITHUB_PAT"], os.environ.get("SLACK_WEBHOOK", ""))
`,
  },
  {
    name: 'detector_adapter.py',
    desc: 'CV adapter — Ultralytics/ONNX/Stub behind one Detector.predict() interface. Swap backends without touching business logic.',
    tags: ['cv', 'adapter'],
    code: `#!/usr/bin/env python3
"""Detector Adapter — Usage: python detector_adapter.py --backend stub"""
import argparse, numpy as np
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class Detection:
    frame_idx: int; track_id: Optional[int]; bbox_xyxy: List[float]
    confidence: float; class_id: int; class_name: str
    keypoints: Optional[object] = None; meta: dict = field(default_factory=dict)

class BaseDetector:
    def predict(self, frame, frame_idx=0) -> List[Detection]: raise NotImplementedError

class StubDetector(BaseDetector):
    def predict(self, frame, frame_idx=0):
        return [Detection(frame_idx, 1, [.2, .1, .5, .9], .95, 0, "person")]

BACKENDS = {"stub": StubDetector}

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--backend", default="stub", choices=list(BACKENDS))
    a = p.parse_args()
    det = BACKENDS[a.backend]()
    for d in det.predict(np.zeros((480, 640, 3), dtype=np.uint8)):
        print(f"  id={d.track_id} conf={d.confidence:.2f} bbox={d.bbox_xyxy}")
`,
  },
  {
    name: 'react_agent_mcp.py',
    desc: 'ReAct loop with MCP tool integration via Anthropic SDK. Deterministic tool execution, max-steps cap.',
    tags: ['react', 'mcp'],
    code: `#!/usr/bin/env python3
"""ReAct Agent + MCP Tools
Usage: python react_agent_mcp.py --query "list stale relationships"
Env:  ANTHROPIC_API_KEY | pip install anthropic"""
import os, sys, json, argparse
try: import anthropic
except ImportError: print("pip install anthropic"); sys.exit(1)

TOOLS = [
    {"name": "search_data", "description": "Search project data matching a query.",
     "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
    {"name": "list_items", "description": "List items by status.",
     "input_schema": {"type": "object", "properties": {"status": {"type": "string", "enum": ["open","stale","done","blocked"]}}, "required": ["status"]}},
]

def execute_tool(name, inputs):
    if name == "search_data": return {"results": [{"id": "001", "status": "stale"}]}
    return {"items": [{"id": "001", "status": inputs.get("status")}]}

def run(query, max_steps=8):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    messages = [{"role": "user", "content": query}]
    for step in range(max_steps):
        r = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=1000,
            system="Precise agent. Use tools for data. Never fabricate. Stop when complete.",
            tools=TOOLS, messages=messages)
        messages.append({"role": "assistant", "content": r.content})
        if r.stop_reason == "end_turn":
            return next((b.text for b in r.content if hasattr(b, "text")), "no response")
        results = []
        for b in r.content:
            if b.type == "tool_use":
                print(f"  [step {step+1}] {b.name}({json.dumps(b.input)[:50]})")
                results.append({"type": "tool_result", "tool_use_id": b.id, "content": json.dumps(execute_tool(b.name, b.input))})
        if results: messages.append({"role": "user", "content": results})
    return "max steps reached"

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--query", default="list open items")
    print(run(p.parse_args().query))
`,
  },
  {
    name: 'honcho_memory_agent.py',
    desc: 'Stateful memory agent via Honcho. SQLite zero-config local dev.',
    tags: ['memory', 'honcho'],
    code: `#!/usr/bin/env python3
"""Honcho Memory Agent
Usage: python honcho_memory_agent.py --user-id yaas
Env:  HONCHO_DB=sqlite:///honcho.db | pip install honcho-ai"""
import os, sys, argparse

def main():
    try: from honcho import Honcho
    except ImportError: print("pip install honcho-ai"); sys.exit(1)
    p = argparse.ArgumentParser()
    p.add_argument("--user-id", default="yaas")
    p.add_argument("--app", default="build-agent")
    a = p.parse_args()
    client = Honcho(db_url=os.environ.get("HONCHO_DB", "sqlite:///honcho.db"))
    app = client.apps.get_or_create(name=a.app)
    user = client.apps.users.get_or_create(app_id=app.id, name=a.user_id)
    session = client.apps.users.sessions.create(app_id=app.id, user_id=user.id)
    print(f"[honcho] session {session.id[:8]}... | 'history' or 'quit'\\n")
    history = []
    while True:
        try: inp = input("you: ").strip()
        except (EOFError, KeyboardInterrupt): break
        if not inp: continue
        if inp.lower() == "quit": break
        if inp.lower() == "history":
            for m in client.apps.users.sessions.messages.list(app_id=app.id, user_id=user.id, session_id=session.id).items:
                print(f"  [{'user' if m.is_user else 'agent'}] {m.content}")
            continue
        client.apps.users.sessions.messages.create(app_id=app.id, user_id=user.id, session_id=session.id, is_user=True, content=inp)
        resp = f"[agent] received: '{inp}' | depth: {len(history)}"
        client.apps.users.sessions.messages.create(app_id=app.id, user_id=user.id, session_id=session.id, is_user=False, content=resp)
        history.append(inp)
        print(resp + "\\n")

if __name__ == "__main__": main()
`,
  },
]

export default function AgentScripts({ stack, repoFullName }: { stack: ProjectStack; repoFullName?: string }) {
  const [view, setView] = useState<ScriptsView>('generator')

  function download(name: string, code: string) {
    const blob = new Blob([code], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
  }

  function copy(code: string) {
    navigator.clipboard?.writeText(code)
  }

  const activeClass = 'border-emerald-500 text-emerald-400'
  const idleClass = 'border-transparent text-gray-500 hover:text-gray-300'

  return (
    <div className="space-y-3">
      <div className="flex gap-0 border-b border-gray-800">
        {(['generator', 'library'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`text-[11px] font-mono px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${view === v ? activeClass : idleClass}`}
          >
            {v === 'library' ? 'script library' : 'script generator'}
          </button>
        ))}
      </div>

      {view === 'library' && (
        <div className="space-y-2">
          {AGENTS.map(agent => (
            <div key={agent.name} className="bg-gray-800/40 border border-gray-700 rounded-lg p-3">
              <div className="text-[11px] font-semibold font-mono text-gray-200 mb-1">{agent.name}</div>
              <div className="text-[10px] font-mono text-gray-500 mb-3 leading-relaxed">{agent.desc}</div>
              <div className="flex gap-1.5 items-center flex-wrap">
                <button
                  onClick={() => download(agent.name, agent.code)}
                  className="text-[10px] font-mono px-2.5 py-1 rounded border border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-1"
                >
                  ↓ download
                </button>
                <button
                  onClick={() => copy(agent.code)}
                  className="text-[10px] font-mono px-2.5 py-1 rounded border border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  ⎘ copy
                </button>
                {agent.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'generator' && <ScriptGeneratorPanel stack={stack} repoFullName={repoFullName} />}
    </div>
  )
}
