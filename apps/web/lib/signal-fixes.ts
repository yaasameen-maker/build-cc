export interface SignalFix {
  description: string
  fixHint: string
  fileHints: string[]
}

export const SIGNAL_FIXES: Record<string, SignalFix> = {
  has_readme: {
    description: 'No README.md detected',
    fixHint: 'Create a README.md at the root with: project name, what it does, how to run it, and environment setup.',
    fileHints: ['README.md', 'README'],
  },
  has_env_example: {
    description: 'No .env.example file detected',
    fixHint: 'Create .env.example listing every required environment variable with placeholder values — never commit real secrets.',
    fileHints: ['.env.example', '.env.sample', '.env.template'],
  },
  has_cicd: {
    description: 'No CI/CD pipeline detected',
    fixHint: 'Add a GitHub Actions workflow at .github/workflows/ci.yml to run tests and lint on every push.',
    fileHints: ['.github/workflows/ci.yml', '.github/workflows/main.yml'],
  },
  has_deploy_config: {
    description: 'No deployment config detected',
    fixHint: 'Add a vercel.json, netlify.toml, or railway.toml to define your deployment settings.',
    fileHints: ['vercel.json', 'netlify.toml', 'railway.toml'],
  },
  has_docker: {
    description: 'No Docker Compose file detected',
    fixHint: 'Add docker-compose.yml to define services for local development parity with production.',
    fileHints: ['docker-compose.yml', 'docker-compose.yaml'],
  },
  has_dockerfile: {
    description: 'No Dockerfile detected',
    fixHint: 'Add a Dockerfile to containerize your app. Use multi-stage builds to keep images small.',
    fileHints: ['Dockerfile', 'apps/api/Dockerfile', 'apps/web/Dockerfile'],
  },
  has_db_schema: {
    description: 'No database schema file detected',
    fixHint: 'Add a schema file (prisma/schema.prisma, alembic versions/, or .sql migrations) to version-control your database structure.',
    fileHints: ['prisma/schema.prisma', 'schema.sql', 'supabase/schema.sql'],
  },
  has_migrations: {
    description: 'No database migrations directory detected',
    fixHint: 'Add a migrations/ folder and use a migration tool (Alembic, Prisma Migrate, Flyway) to track schema changes.',
    fileHints: ['migrations/', 'alembic/versions/', 'prisma/migrations/'],
  },
  has_e2e: {
    description: 'No E2E tests detected',
    fixHint: 'Add Playwright or Cypress tests in a tests/e2e/ or e2e/ directory. Start with critical user flows.',
    fileHints: ['playwright.config.ts', 'cypress.config.ts', 'e2e/'],
  },
  has_unit_tests: {
    description: 'No unit tests detected',
    fixHint: 'Add a __tests__/ directory or *.test.ts files. Use Jest (JS/TS) or pytest (Python).',
    fileHints: ['__tests__/', 'tests/', 'jest.config.ts', 'pytest.ini'],
  },
  has_lighthouse_ci: {
    description: 'No Lighthouse CI config detected',
    fixHint: 'Add lighthouserc.js and the Lighthouse CI GitHub Action to track Core Web Vitals on every PR.',
    fileHints: ['lighthouserc.js', '.lighthouserc.json', '.github/workflows/lighthouse.yml'],
  },
  has_openapi: {
    description: 'No OpenAPI / Swagger spec detected',
    fixHint: 'Add an openapi.yaml or use FastAPI\'s auto-generated /docs endpoint. Document all endpoints.',
    fileHints: ['openapi.yaml', 'swagger.yaml', 'openapi.json'],
  },
  has_cors: {
    description: 'No CORS configuration detected',
    fixHint: 'Add CORS middleware. FastAPI: CORSMiddleware. Express: cors() package. Restrict origins to your known domains.',
    fileHints: ['main.py', 'server.ts', 'index.ts', 'app.py', 'app.ts'],
  },
  has_health: {
    description: 'No health check endpoint detected',
    fixHint: 'Add a GET /health endpoint that returns { status: "ok" }. Used by load balancers and monitoring.',
    fileHints: ['main.py', 'server.ts', 'routes/health.ts'],
  },
  has_auth_file: {
    description: 'No auth module detected',
    fixHint: 'Add an auth module (auth.ts, auth.py) handling session management, token validation, or OAuth.',
    fileHints: ['lib/auth.ts', 'auth.py', 'middleware/auth.ts', 'utils/auth.py'],
  },
  has_pwa: {
    description: 'No PWA manifest + service worker detected',
    fixHint: 'Add public/manifest.json and a service worker (sw.js). Register the SW in your root layout.',
    fileHints: ['public/manifest.json', 'public/sw.js', 'next.config.ts'],
  },
  has_otel: {
    description: 'No observability / OpenTelemetry detected',
    fixHint: 'Add OpenTelemetry or Langfuse instrumentation to trace requests and LLM calls in production.',
    fileHints: ['instrumentation.ts', 'otel.py', 'tracing.ts'],
  },
  has_security_scan: {
    description: 'No security scanner in CI detected',
    fixHint: 'Add a security scanning step in CI — GitHub CodeQL, Snyk, or Trivy for container scanning.',
    fileHints: ['.github/workflows/security.yml', '.github/workflows/codeql.yml'],
  },
  has_license: {
    description: 'No LICENSE file detected',
    fixHint: 'Add a LICENSE file to the repo root. MIT is common for open-source; check with your team for commercial projects.',
    fileHints: ['LICENSE', 'LICENSE.md', 'LICENSE.txt'],
  },
  has_changelog: {
    description: 'No CHANGELOG or session notes detected',
    fixHint: 'Add a CHANGELOG.md tracking notable changes per version, or session notes in a docs/sessions/ folder.',
    fileHints: ['CHANGELOG.md', 'CHANGELOG', 'docs/sessions/'],
  },
  has_monorepo: {
    description: 'No monorepo workspace config detected',
    fixHint: 'Add pnpm-workspace.yaml, package.json workspaces, or turbo.json to define your monorepo structure.',
    fileHints: ['pnpm-workspace.yaml', 'turbo.json', 'nx.json'],
  },
  has_vector_db: {
    description: 'No vector database dependency detected',
    fixHint: 'Add a vector DB client (Pinecone, Weaviate, Chroma, pgvector) for semantic search or RAG.',
    fileHints: ['requirements.txt', 'package.json'],
  },
  has_evals: {
    description: 'No evals or golden dataset detected',
    fixHint: 'Add an evals/ directory with test prompts and expected outputs. Use Braintrust or PromptFoo for structured evaluation.',
    fileHints: ['evals/', 'tests/evals/', 'golden/'],
  },
  has_mcp: {
    description: 'No MCP config detected',
    fixHint: 'Add a .mcp.json or mcp-config.json to define your Model Context Protocol server configuration.',
    fileHints: ['.mcp.json', 'mcp-config.json', 'mcp.json'],
  },
  has_prompts: {
    description: 'No prompts directory or SYSTEM.md detected',
    fixHint: 'Add a prompts/ directory or SYSTEM.md to version-control your system prompts and templates.',
    fileHints: ['prompts/', 'SYSTEM.md', 'prompts/system.txt'],
  },
  has_tools: {
    description: 'No tools/ or agents/ directory detected',
    fixHint: 'Add a tools/ or agents/ directory for your AI tool definitions and agent implementations.',
    fileHints: ['tools/', 'agents/', 'src/tools/'],
  },
  has_adapter: {
    description: 'No adapter pattern file detected',
    fixHint: 'Add an adapter layer (adapters/, lib/adapters.ts) to abstract provider-specific logic from your core business logic.',
    fileHints: ['adapters/', 'lib/adapters.ts', 'src/adapters/'],
  },
}
