# build.cc

**Build pipeline command center for developers and technical founders.**

build.cc is a checklist-driven tool that tracks every layer of a software build — from product definition and UX through backend architecture, deployment, testing, and compliance. Connect a GitHub repo and the app automatically detects your tech stack, verifies checklist items, and flags things that need attention.

---

## What it does

- **Structured checklist** across frontend and backend: business model, PRD, UX, build, deployment, testing, compliance, LLM/agent architecture
- **Auto-detection** — syncs with a linked GitHub repo to auto-verify checklist items (CI/CD, env config, test directories, dependencies, deployment config, and more)
- **Review flags** — amber warnings surface items that need human verification without being falsely marked complete
- **Deployment panel** — record your live, staging, and dashboard URLs per build
- **Agent scripts** — pre-written Claude prompts for common build tasks
- **Resources tab** — curated learning links

---

## Stack

| Layer | Technology |
|---|---|
| Web | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Auth | NextAuth v5, GitHub OAuth |
| API | FastAPI (Python), deployed on Railway |
| Database | PostgreSQL on Railway |
| Hosting | Vercel (web), Railway (API + DB) |

---

## Getting started (local dev)

### Prerequisites

- Node.js 20+, pnpm
- Python 3.11+
- A PostgreSQL database
- A GitHub OAuth app ([create one here](https://github.com/settings/developers))

### 1. Clone and install

```bash
git clone https://github.com/yaasameen-maker/build-cc.git
cd build-cc
pnpm install
```

### 2. Configure environment

Copy the example env files and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

**`apps/web/.env.local`**
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random string>
GITHUB_CLIENT_ID=<your OAuth app client ID>
GITHUB_CLIENT_SECRET=<your OAuth app client secret>
API_URL=http://localhost:8000
```

**`apps/api/.env`**
```
# No secrets needed locally — GitHub token is passed per-request via header
```

### 3. Set up the database

Run the SQL schema from `supabase/` against your Postgres instance, or apply it manually.

### 4. Run the apps

```bash
# Web (from repo root)
pnpm --filter web dev

# API (in a separate terminal)
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload
```

The web app runs at `http://localhost:3000`, the API at `http://localhost:8000`.

---

## GitHub OAuth scope

The app requests the `repo` scope to read file trees, commits, PRs, and issues from linked repos — including private ones. It never writes to your repositories. See [PRIVACY.md](PRIVACY.md) for the full data disclosure.

---

## Privacy

See [PRIVACY.md](PRIVACY.md) for a plain-English breakdown of what data is collected, what is stored, and what is discarded.

---

## License

MIT
