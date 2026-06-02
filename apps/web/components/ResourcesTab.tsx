'use client'

import { useState } from 'react'

type TopTab = 'models' | 'by-usecase' | 'resources'

const CATS = ['frontier & reasoning', 'coding', 'speed & high volume', 'open source & self-hosted', 'multimodal (vision + text)', 'specialized & embedding'] as const
type Cat = typeof CATS[number]

const CAT_COLORS: Record<Cat, string> = {
  'frontier & reasoning': '#534AB7',
  'coding': '#1D9E75',
  'speed & high volume': '#92400E',
  'open source & self-hosted': '#374151',
  'multimodal (vision + text)': '#1D4ED8',
  'specialized & embedding': '#991B1B',
}

const MODELS = [
  { cat: 'frontier & reasoning', name: 'Claude Opus 4.8', provider: 'Anthropic', cost: 'paid', openrouter: true, desc: "Anthropic's most powerful model. Best-in-class instruction following (9.3/10 MT-Bench), complex multi-step reasoning, and agent reliability. SWE-bench leader at 80.8%. Use when quality matters more than cost.", good: ['complex agent chains', 'multi-step planning', 'agentic coding', 'long-form writing', 'research synthesis', 'nuanced judgment'], star: ['agentic coding', 'multi-step planning'], context: '200K', pricing: '~$15/$75 per 1M tok', speed: 'medium' },
  { cat: 'frontier & reasoning', name: 'Claude Opus 4.6', provider: 'Anthropic', cost: 'paid', openrouter: true, desc: 'Previous Opus flagship. Still top-tier on benchmarks (80.8% SWE-bench). Excellent for production agent systems where reliability and depth matter. ECC uses Opus for planner, architect, healthcare-reviewer, and all three GAN harness agents.', good: ['agent orchestration', 'architecture decisions', 'healthcare/compliance review', 'GAN harness planning'], star: ['agent orchestration', 'architecture decisions'], context: '200K', pricing: '~$15/$75 per 1M tok', speed: 'medium' },
  { cat: 'frontier & reasoning', name: 'GPT-5.5 / GPT-5.5 Pro', provider: 'OpenAI', cost: 'paid', openrouter: true, desc: "OpenAI's 2026 flagship. 100% AIME 2025, 92.4% GPQA Diamond. Strongest on math/science benchmarks. Multimodal with image reasoning. Best conversational AI tone. Variable pricing — model carefully before production.", good: ['advanced math', 'science reasoning', 'multimodal reasoning', 'conversational AI', 'image analysis'], star: ['advanced math', 'science reasoning'], context: '1M+', pricing: 'variable — check OpenRouter', speed: 'medium' },
  { cat: 'frontier & reasoning', name: 'DeepSeek R1', provider: 'DeepSeek', cost: 'paid', openrouter: true, desc: 'Best reasoning model for math and finance. MMLU 90.8 (highest), MATH 97.3 (highest), HumanEval 95.2. Open weights available for self-hosting. Cost-efficient — $0.25/$1.10 per 1M tokens. Ideal for regulated workloads.', good: ['mathematics', 'financial modeling', 'logic chains', 'STEM reasoning', 'self-hosted regulated deployments'], star: ['mathematics', 'financial modeling'], context: '128K', pricing: '$0.25/$1.10 per 1M tok', speed: 'slow (chain-of-thought)' },
  { cat: 'frontier & reasoning', name: 'Kimi K2 Thinking', provider: 'Moonshot AI', cost: 'paid', openrouter: true, desc: '99.1% AIME, 84.5% GPQA Diamond at $0.60/M — best quality-per-dollar in the reasoning tier. Strong on complex logic chains. Emerging option via OpenRouter for cost-conscious high-stakes reasoning.', good: ['math competitions', 'complex logic', 'cost-efficient reasoning'], star: ['cost-efficient reasoning'], context: '128K', pricing: '~$0.60 per 1M tok', speed: 'slow' },
  { cat: 'frontier & reasoning', name: 'Grok 4 / Grok 4 Fast', provider: 'xAI', cost: 'paid', openrouter: true, desc: "xAI's 2026 frontier model. 2M token context window — largest practical context of any model. Strong on agent workflows, tool use, and real-time X/Twitter signals. Grok 4 Fast is the speed-optimized variant.", good: ['extremely long context', 'real-time social signals', 'tool-use heavy agents', 'X/Twitter context'], star: ['extremely long context'], context: '2M tokens', pricing: 'via OpenRouter', speed: 'fast (Grok 4 Fast)' },
  { cat: 'coding', name: 'Claude Sonnet 4.6', provider: 'Anthropic', cost: 'paid', openrouter: true, desc: 'Best everyday coding assistant — 79.6% SWE-bench, near-Opus quality at Sonnet pricing. ECC uses Sonnet for all 52 code review, build resolver, and language-specific agents. The default choice for most agentic builds.', good: ['code review', 'build error resolution', 'TypeScript/Python/Go', 'API design', 'refactoring', 'testing'], star: ['code review', 'build error resolution'], context: '200K (1M beta)', pricing: '~$3/$15 per 1M tok', speed: 'fast' },
  { cat: 'coding', name: 'Claude Sonnet 4.5', provider: 'Anthropic', cost: 'paid', openrouter: true, desc: 'HumanEval 93.0% — one of the strongest pure code generation scores. Excellent for codebases, debugging, and multi-step code analysis. Strong instruction-following for complex refactoring tasks.', good: ['code generation', 'debugging', 'multi-file refactoring', 'test writing'], star: ['code generation'], context: '200K', pricing: '~$3/$15 per 1M tok', speed: 'fast' },
  { cat: 'coding', name: 'GPT-5.3 Codex / o3', provider: 'OpenAI', cost: 'paid', openrouter: true, desc: "OpenAI's coding-specialized models. o3 leads HumanEval at 95.2%. Codex is purpose-built for code generation and completion. o4-mini at 93.4% is a strong cost-efficient alternative.", good: ['code completion', 'autocomplete', 'code generation', 'test generation'], star: ['code completion', 'autocomplete'], context: '200K', pricing: 'varies by model', speed: 'fast (o4-mini), medium (o3)' },
  { cat: 'coding', name: 'Gemini 3 Flash / 3.1 Pro', provider: 'Google', cost: 'paid', openrouter: true, desc: 'Gemini 3.1 Pro hits 80.6% SWE-bench — competitive with Opus on agentic coding. Gemini 3 Flash is the best cost-efficient option for everyday coding at 78% SWE-bench. 1M context window.', good: ['agentic coding', 'everyday code assistance', 'high-volume code tasks', 'Google ecosystem'], star: ['high-volume code tasks'], context: '1M', pricing: 'Flash ~$0.30/$2.50, Pro higher', speed: 'Flash: very fast, Pro: medium' },
  { cat: 'coding', name: 'DeepSeek-Coder / Qwen3-Coder', provider: 'DeepSeek / Alibaba', cost: 'free', openrouter: true, desc: 'Specialized code models, open-weight. Best for autocomplete, code completion, and on-device use cases. Self-host via Hugging Face or run via OpenRouter at very low cost.', good: ['code autocomplete', 'code completion', 'self-hosted code AI', 'low-cost code generation'], star: ['self-hosted code AI'], context: '32K-128K', pricing: 'very low / self-hostable', speed: 'fast' },
  { cat: 'speed & high volume', name: 'Claude Haiku 4.5', provider: 'Anthropic', cost: 'paid', openrouter: true, desc: "Anthropic's fastest, cheapest model. ECC uses Haiku for doc-updater — low-stakes doc sync. Ideal for rule-following tasks, classification, quick lookups, and any high-frequency operation where latency matters.", good: ['doc sync', 'classification', 'summarization', 'quick lookups', 'high-frequency operations', 'cost-sensitive tasks'], star: ['high-frequency operations', 'classification'], context: '200K', pricing: '~$0.80/$4 per 1M tok', speed: 'very fast' },
  { cat: 'speed & high volume', name: 'Gemini 2.5 Flash / 3.x Flash', provider: 'Google', cost: 'paid', openrouter: true, desc: 'Best value among major commercial APIs — $0.30/$2.50 per 1M tokens, 1M context. Recommended for high-volume tasks at low cost. Gemini Flash consistently wins cost-efficiency benchmarks.', good: ['high-volume tasks', 'batch processing', 'cost-sensitive production', 'document processing', 'summarization at scale'], star: ['cost-sensitive production', 'batch processing'], context: '1M', pricing: '$0.30/$2.50 per 1M tok', speed: 'very fast' },
  { cat: 'speed & high volume', name: 'GPT-4.1 mini / nano', provider: 'OpenAI', cost: 'paid', openrouter: true, desc: "OpenAI's budget-tier models. GPT-4.1 mini for standard tasks at ~$40/month per 10K conversations. nano is the cheapest OpenAI option. Good for high-frequency classification and quick text ops.", good: ['high-volume classification', 'quick text ops', 'budget chatbots', 'form filling', 'extraction'], star: ['budget chatbots'], context: '1M', pricing: 'mini ~$0.40/$1.60, nano lower', speed: 'very fast' },
  { cat: 'speed & high volume', name: 'Llama 4 Scout / Maverick', provider: 'Meta (open source)', cost: 'free', openrouter: true, desc: 'Open-weight powerhouse. Scout has a 10M token context window — largest open-source. Maverick beats GPT-4o and Gemini 2.0 Flash on major benchmarks. Multimodal, multilingual (12 languages). Self-host via Hugging Face.', good: ['extremely long context', 'open-source deployment', 'self-hosted production', 'private data', 'low-cost inference', 'multimodal'], star: ['open-source deployment', 'extremely long context'], context: 'Scout: 10M, Maverick: large', pricing: 'free (self-host) / low via API', speed: 'fast' },
  { cat: 'speed & high volume', name: 'Groq — Llama 3.1 / Mixtral', provider: 'Groq', cost: 'free', openrouter: true, desc: "Fastest inference available via Groq's custom LPU chips. Free tier with rate limits. Llama 3.1 70B and Mixtral 8x7B available. Ideal for latency-critical agent steps where response time matters more than model quality.", good: ['ultra-low latency', 'real-time applications', 'agent steps where speed is critical', 'free-tier rapid prototyping'], star: ['ultra-low latency'], context: '32K-128K', pricing: 'free tier / low paid', speed: 'fastest available' },
  { cat: 'open source & self-hosted', name: 'Llama 4 Scout / Maverick / Behemoth', provider: 'Meta', cost: 'free', openrouter: false, desc: "Meta's 2026 open-weight family. Scout: 10M context, ideal for private long-document work. Maverick: benchmark-competitive with frontier models. Behemoth: largest, for maximum capability. Run on Hugging Face or self-host.", good: ['private data', 'air-gapped deployments', 'regulated industries', 'long context', 'cost savings at scale'], star: ['private data', 'air-gapped deployments'], context: 'Scout: 10M, Maverick: 1M+', pricing: 'free to download, compute cost only', speed: 'varies by hardware' },
  { cat: 'open source & self-hosted', name: 'DeepSeek V3 / R1', provider: 'DeepSeek', cost: 'free', openrouter: true, desc: 'Open-weight frontier. DeepSeek V3 at $0.25/$1.10 API, or self-host free. R1 is the best open reasoning model. MMLU 90.8. Strong choice for regulated workloads where data cannot leave your infra.', good: ['regulated deployments', 'math and reasoning', 'cost-efficient API', 'self-hosted reasoning', 'private cloud'], star: ['self-hosted reasoning', 'regulated deployments'], context: '128K', pricing: 'V3: $0.25/$1.10, R1: similar', speed: 'medium' },
  { cat: 'open source & self-hosted', name: 'Qwen3 family', provider: 'Alibaba', cost: 'free', openrouter: true, desc: 'Strong open-weight family. Qwen3-Coder for code tasks. Qwen3.7 Max cheapest top-10 model at $1.25/M. Supports Chinese language natively. Run via Hugging Face or Ollama locally.', good: ['Chinese language tasks', 'budget self-hosting', 'coding', 'local LLM', 'edge deployment'], star: ['Chinese language tasks', 'local LLM'], context: '128K', pricing: 'free / $1.25 per 1M API', speed: 'fast' },
  { cat: 'open source & self-hosted', name: 'Phi 4 / Phi 3 family', provider: 'Microsoft', cost: 'free', openrouter: true, desc: "Microsoft's small but mighty models. Best-in-class for on-device and edge workloads. Phi 4 outperforms much larger models on reasoning per parameter. Run on a laptop or edge device.", good: ['on-device AI', 'edge computing', 'mobile AI', 'laptop inference', 'IoT agents', 'low-power devices'], star: ['on-device AI', 'edge computing'], context: '16K-128K', pricing: 'free', speed: 'very fast on device' },
  { cat: 'multimodal (vision + text)', name: 'GPT-5.5 / GPT-5.2 (vision)', provider: 'OpenAI', cost: 'paid', openrouter: true, desc: 'Best multimodal reasoning — image + text. Understands charts, diagrams, code screenshots, UI mockups. Use when the agent needs to see and reason about visual content.', good: ['UI/UX review from screenshots', 'chart analysis', 'diagram understanding', 'document with images', 'code from image'], star: ['UI/UX review from screenshots', 'chart analysis'], context: '1M+', pricing: 'via OpenRouter', speed: 'medium' },
  { cat: 'multimodal (vision + text)', name: 'Claude Opus 4.x / Sonnet 4.x (vision)', provider: 'Anthropic', cost: 'paid', openrouter: true, desc: "Claude's vision capability. Strong at document analysis with images, UI screenshot review, and multimodal reasoning tasks. Pairs naturally with Claude Code for visual debugging.", good: ['document analysis', 'UI screenshot review', 'multimodal agent tasks', 'image + code'], star: ['document analysis', 'UI screenshot review'], context: '200K', pricing: 'standard Claude pricing', speed: 'medium' },
  { cat: 'multimodal (vision + text)', name: 'Gemini 3 Pro / Flash (vision)', provider: 'Google', cost: 'paid', openrouter: true, desc: 'Native multimodal from Google. Excellent at long documents with mixed content. Gemini Flash handles multimodal at low cost. Strong for Google Workspace document analysis.', good: ['long doc with images', 'Google Docs analysis', 'video frame understanding', 'chart reasoning'], star: ['long doc with images'], context: '1M', pricing: 'Flash: low, Pro: higher', speed: 'Flash: fast, Pro: medium' },
  { cat: 'specialized & embedding', name: 'DeepSeek R1 (math/science)', provider: 'DeepSeek', cost: 'paid', openrouter: true, desc: 'The go-to for pure mathematical and scientific reasoning. MATH benchmark 97.3 — highest of any model. Finance, statistics, computational science, engineering calculations.', good: ['pure mathematics', 'statistics', 'financial calculations', 'engineering', 'science', 'logic proofs'], star: ['pure mathematics', 'financial calculations'], context: '128K', pricing: '$0.25/$1.10 per 1M tok', speed: 'slow (chain-of-thought)' },
  { cat: 'specialized & embedding', name: 'text-embedding-3-small / large', provider: 'OpenAI', cost: 'paid', openrouter: false, desc: 'Standard embedding models for RAG pipelines. Use the same model at index time and query time — never mix. text-embedding-3-small is cost-efficient. text-embedding-3-large for maximum retrieval quality.', good: ['RAG pipelines', 'semantic search', 'vector DB indexing', 'similarity matching', 'document retrieval'], star: ['RAG pipelines', 'semantic search'], context: 'N/A (embedding)', pricing: 'very low ($0.02-$0.13 per 1M tok)', speed: 'very fast' },
  { cat: 'specialized & embedding', name: 'Nomic Embed / BGE-M3', provider: 'Nomic / BAAI', cost: 'free', openrouter: false, desc: 'Best open-source embedding models. BGE-M3 supports multilingual embeddings. Both run locally via Hugging Face. Use when you cannot send data to external APIs or need free embeddings.', good: ['private RAG', 'multilingual embeddings', 'self-hosted vector search', 'no-API-cost semantic search'], star: ['private RAG', 'self-hosted vector search'], context: 'N/A (embedding)', pricing: 'free (self-host)', speed: 'fast on CPU' },
  { cat: 'specialized & embedding', name: 'Grok 4 (long context)', provider: 'xAI', cost: 'paid', openrouter: true, desc: '2M token context window — use when you need to process an entire codebase, massive legal document, or research corpus in a single call. No chunking required at this scale.', good: ['full codebase in context', 'massive document analysis', 'legal document review', 'research corpus processing'], star: ['full codebase in context', 'massive document analysis'], context: '2M tokens', pricing: 'via OpenRouter', speed: 'medium' },
]

const USE_CASES = [
  { icon: '🤖', title: 'agentic coding & builds', items: [{ model: 'Claude Opus 4.6/4.8', why: 'top SWE-bench (80.8%), ECC planner/architect' }, { model: 'Claude Sonnet 4.6', why: 'default for all 52 ECC code agents' }, { model: 'Gemini 3.1 Pro', why: '80.6% SWE-bench, strong alternative' }, { model: 'GPT-5.4 / o3', why: '95.2% HumanEval, code completion specialist' }] },
  { icon: '🔢', title: 'math & computation', items: [{ model: 'DeepSeek R1', why: 'MATH 97.3% — highest of any model' }, { model: 'Kimi K2 Thinking', why: '99.1% AIME, best quality/price' }, { model: 'GPT-5.5', why: '100% AIME 2025, top science benchmarks' }, { model: 'o3 / o4-mini', why: '96.7% MATH, strong reasoning chains' }] },
  { icon: '⚡', title: 'speed & high volume', items: [{ model: 'Groq (Llama 3.1)', why: 'fastest inference available — free tier' }, { model: 'Gemini 2.5 Flash', why: 'best value — $0.30/1M tok, 1M context' }, { model: 'Claude Haiku 4.5', why: "Anthropic's fastest, ECC doc-updater" }, { model: 'GPT-4.1 mini/nano', why: "OpenAI's budget tier, high frequency" }] },
  { icon: '🔒', title: 'private / regulated deployments', items: [{ model: 'Llama 4 Scout/Maverick', why: 'open-weight, self-host, 10M context' }, { model: 'DeepSeek R1/V3', why: 'open-weight, MMLU 90.8, self-hostable' }, { model: 'Mistral (EU)', why: 'EU data-residency, Apache 2.0, on-premise' }, { model: 'Qwen3 family', why: 'open-weight, Hugging Face, Ollama local' }] },
  { icon: '🎨', title: 'multimodal (vision)', items: [{ model: 'GPT-5.5 (vision)', why: 'best image+text reasoning' }, { model: 'Claude Sonnet 4.6 (vision)', why: 'UI screenshot review, doc analysis' }, { model: 'Gemini Flash/Pro (vision)', why: 'native multimodal, low cost' }, { model: 'Llama 4 Maverick', why: 'open-source vision, privacy-first' }] },
  { icon: '📝', title: 'writing & content', items: [{ model: 'Claude Opus/Sonnet', why: 'best instruction following (9.3/10 MT-Bench)' }, { model: 'GPT-5.1 / GPT-5.5', why: 'best conversational tone, content style' }, { model: 'Gemini 3 Pro', why: 'long-form docs with Google Workspace' }, { model: 'Mistral Large 3', why: 'European multilingual content' }] },
  { icon: '🔍', title: 'RAG & semantic search', items: [{ model: 'text-embedding-3-small', why: 'standard RAG embedding, very cheap' }, { model: 'text-embedding-3-large', why: 'maximum retrieval quality' }, { model: 'BGE-M3 / Nomic Embed', why: 'free, self-hosted, multilingual' }, { model: 'Llama 4 Scout (10M ctx)', why: 'skip chunking entirely at this scale' }] },
  { icon: '💰', title: 'budget / free tier', items: [{ model: 'Mistral Small 3.2', why: 'cheapest production LLM ($0.06/1M)' }, { model: 'Groq free tier', why: 'Llama 3.1 / Mixtral — fastest + free' }, { model: 'Gemini Flash (Google AI Studio)', why: 'generous free tier' }, { model: 'DeepSeek V3 API', why: 'frontier quality at $0.25/1M tok' }] },
  { icon: '📱', title: 'on-device / edge', items: [{ model: 'Phi 4 / Phi 3 (Microsoft)', why: 'best reasoning per parameter, runs on laptop' }, { model: 'Llama 4 Scout (quantized)', why: '10M context on edge hardware' }, { model: 'Qwen3-Coder (small)', why: 'code completion on device' }, { model: 'Mistral 7B', why: '4-bit quantized, runs on CPU' }] },
]

const RESOURCES: Record<string, Array<{ icon: string; name: string; desc: string; url: string; link: string; tag: 'free' | 'paid' | 'freemium' | 'oss' }>> = {
  'LLM Providers': [
    { icon: '🌐', name: 'OpenRouter', desc: 'One API, every model — Claude, GPT, Gemini, Llama, Mistral, DeepSeek. Free tier models available.', url: 'openrouter.ai', link: 'https://openrouter.ai', tag: 'freemium' },
    { icon: '🤗', name: 'Hugging Face', desc: 'Open-source model hub. Inference API, Spaces, datasets, fine-tuning. Run models locally or via free Inference API.', url: 'huggingface.co', link: 'https://huggingface.co', tag: 'freemium' },
    { icon: '🤖', name: 'Anthropic Console', desc: 'Claude API direct. Sonnet 4.6, Opus 4.6/4.8, Haiku 4.5. Prompt workbench, evals, usage dashboard.', url: 'console.anthropic.com', link: 'https://console.anthropic.com', tag: 'paid' },
    { icon: '⚡', name: 'OpenAI Platform', desc: 'GPT-5.x, o3, o4-mini, Codex. Embeddings, fine-tuning, Assistants API. Also available via OpenRouter.', url: 'platform.openai.com', link: 'https://platform.openai.com', tag: 'paid' },
    { icon: '🔮', name: 'Google AI Studio', desc: 'Gemini Flash and Pro. Very generous free tier. Fastest path to Gemini for prototyping.', url: 'aistudio.google.com', link: 'https://aistudio.google.com', tag: 'freemium' },
    { icon: '🔥', name: 'Groq', desc: 'Fastest inference — Llama 3.1, Mixtral, Gemma. Free tier with rate limits. Ideal for latency-critical agent steps.', url: 'groq.com', link: 'https://groq.com', tag: 'freemium' },
    { icon: '⚡', name: 'Together AI', desc: 'Run open-source models at scale. Llama 4, Mixtral, Qwen. Fine-tuning API. Competitive pricing.', url: 'together.ai', link: 'https://together.ai', tag: 'paid' },
    { icon: '🧩', name: 'Replicate', desc: 'Run open-source models via API with no infra. Pay per second. Good for image/video gen and specialized models.', url: 'replicate.com', link: 'https://replicate.com', tag: 'paid' },
  ],
  'Deployment & Infra': [
    { icon: '🚂', name: 'Railway', desc: 'All-in-one: FE + BE + Postgres + Redis + cron. Recommended for AI builds. MCP server in ECC.', url: 'railway.app', link: 'https://railway.app', tag: 'freemium' },
    { icon: '⚡', name: 'Supabase', desc: 'Postgres + Auth + Storage + Edge Functions + Realtime. RLS built in. Free tier.', url: 'supabase.com', link: 'https://supabase.com', tag: 'freemium' },
    { icon: '▲', name: 'Vercel', desc: 'Frontend deployment. Preview deploys on PRs. Lighthouse on every deploy. MCP in ECC.', url: 'vercel.com', link: 'https://vercel.com', tag: 'freemium' },
    { icon: '🪰', name: 'Fly.io', desc: 'Edge deployment. Docker-native. Good for FastAPI + ONNX inference servers. Free tier.', url: 'fly.io', link: 'https://fly.io', tag: 'freemium' },
    { icon: '🌍', name: 'Cloudflare', desc: 'Global edge CDN + Workers. Pages for static sites. 3 MCP servers in ECC.', url: 'cloudflare.com', link: 'https://cloudflare.com', tag: 'freemium' },
    { icon: '⚡', name: 'Neon', desc: 'Serverless Postgres with branching. Scale to zero. pgvector for RAG. Free tier.', url: 'neon.tech', link: 'https://neon.tech', tag: 'freemium' },
  ],
  'Dev Tools': [
    { icon: '🌀', name: 'Ngrok', desc: 'Expose local servers to the internet instantly. Essential for webhook testing and MCP server dev. Free tier available.', url: 'ngrok.com', link: 'https://ngrok.com', tag: 'freemium' },
    { icon: '⌨️', name: 'Cursor', desc: 'AI-native IDE. ECC ships a full .cursor/ config. Supports agents, rules, MCP, hooks.', url: 'cursor.sh', link: 'https://cursor.sh', tag: 'freemium' },
    { icon: '🌐', name: 'OpenCode', desc: 'Open-source AI coding agent. ECC .opencode/ plugin. 20+ event hooks. Model-agnostic via OpenRouter.', url: 'opencode.ai', link: 'https://opencode.ai', tag: 'oss' },
    { icon: '⚡', name: 'Zed', desc: 'Fast AI code editor. ECC .zed/ config adapter. Free. GPU-accelerated.', url: 'zed.dev', link: 'https://zed.dev', tag: 'free' },
  ],
  'Observability & Memory': [
    { icon: '📊', name: 'Langfuse', desc: 'LLM observability — prompt hash logging, cost tracking, eval dashboards, OTel export. Open-source and cloud.', url: 'langfuse.com', link: 'https://langfuse.com', tag: 'freemium' },
    { icon: '🧠', name: 'Honcho', desc: 'Stateful memory for AI agents by Plastic Labs. SQLite local dev. Postgres production.', url: 'honcho.dev', link: 'https://www.honcho.dev', tag: 'oss' },
    { icon: '🔭', name: 'OpenTelemetry', desc: 'Vendor-neutral observability standard. Spans: request→retrieval→LLM→postprocess.', url: 'opentelemetry.io', link: 'https://opentelemetry.io', tag: 'oss' },
    { icon: '🔍', name: 'LangSmith', desc: 'LLM debugging, testing, and monitoring from LangChain. Trace explorer, eval datasets.', url: 'smith.langchain.com', link: 'https://smith.langchain.com', tag: 'freemium' },
  ],
  'Search & Research': [
    { icon: '🔍', name: 'Exa AI', desc: 'Neural web search for agents. MCP in ECC. Used by deep-research skill and docs-lookup agent.', url: 'exa.ai', link: 'https://exa.ai', tag: 'paid' },
    { icon: '🔥', name: 'Firecrawl', desc: 'Web scraping and crawling MCP. Converts any website to LLM-ready markdown.', url: 'firecrawl.dev', link: 'https://www.firecrawl.dev', tag: 'freemium' },
    { icon: '📚', name: 'Context7', desc: 'Live library/framework documentation MCP. Agents always get current API references, not stale training data.', url: 'context7.com', link: 'https://context7.com', tag: 'free' },
  ],
  'Learning & Roadmaps': [
    { icon: '🗺', name: 'roadmap.sh', desc: 'Interactive developer roadmaps — Frontend, Backend, DevOps, AI Engineer, and 100+ more. See exactly which skills to learn next and track your progress.', url: 'roadmap.sh', link: 'https://roadmap.sh', tag: 'free' },
    { icon: '🧠', name: 'AI Engineer Roadmap', desc: 'Step-by-step path to becoming an AI engineer — LLMs, RAG, agents, evals, observability, and deployment.', url: 'roadmap.sh/ai-engineer', link: 'https://roadmap.sh/ai-engineer', tag: 'free' },
    { icon: '👁', name: 'Computer Vision Roadmap', desc: 'From image basics to object detection, segmentation, and CV model deployment. Covers OpenCV, YOLO, and more.', url: 'roadmap.sh/computer-vision', link: 'https://roadmap.sh/computer-vision', tag: 'free' },
    { icon: '🚀', name: 'DevOps Roadmap', desc: 'CI/CD, Docker, Kubernetes, observability, security scanning, and cloud deployment — the full DevOps journey.', url: 'roadmap.sh/devops', link: 'https://roadmap.sh/devops', tag: 'free' },
  ],
  'Security': [
    { icon: '🛡', name: 'OWASP MCP Top 10', desc: 'The definitive MCP security risk list. Required reading before shipping any MCP server.', url: 'owasp.org/www-project-mcp-top-10', link: 'https://owasp.org/www-project-mcp-top-10/', tag: 'free' },
    { icon: '🤖', name: 'OWASP Agentic Top 10', desc: 'Top 10 security risks for agentic AI applications. Required for production agent deployments.', url: 'genai.owasp.org', link: 'https://genai.owasp.org', tag: 'free' },
  ],
}

const TAG_STYLES: Record<string, string> = {
  free: 'bg-emerald-900/40 text-emerald-400',
  paid: 'bg-amber-900/40 text-amber-400',
  freemium: 'bg-indigo-900/40 text-indigo-400',
  oss: 'bg-gray-700 text-gray-400',
}

export default function ResourcesTab() {
  const [topTab, setTopTab] = useState<TopTab>('models')
  const [activeCat, setActiveCat] = useState<Cat>('frontier & reasoning')

  const visibleModels = MODELS.filter(m => m.cat === activeCat)

  return (
    <div className="text-white">
      {/* Top tabs */}
      <div className="flex gap-0 border-b border-gray-800 mb-4">
        {(['models', 'by use case', 'resources'] as const).map(t => {
          const key = t === 'by use case' ? 'by-usecase' : t as TopTab
          return (
            <button
              key={t}
              onClick={() => setTopTab(key)}
              className={`text-xs font-mono px-4 py-2 border-b-2 transition-colors ${topTab === key ? 'border-emerald-400 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Models panel */}
      {topTab === 'models' && (
        <>
          <div className="flex gap-2 flex-wrap mb-4">
            {CATS.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className="text-[10px] font-mono px-3 py-1 rounded-full border transition-all"
                style={activeCat === cat
                  ? { background: CAT_COLORS[cat], borderColor: CAT_COLORS[cat], color: '#fff' }
                  : { background: 'transparent', borderColor: '#374151', color: '#9ca3af' }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {visibleModels.map(m => (
              <div key={m.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-sm font-semibold font-mono">{m.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{m.provider}</div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${m.cost === 'free' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'}`}>
                      {m.cost === 'free' ? 'free / open' : 'paid API'}
                    </span>
                    {m.openrouter && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/20 text-emerald-600">via OpenRouter</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-mono leading-relaxed mb-2">{m.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {m.good.map(g => (
                    <span key={g} className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${m.star?.includes(g) ? 'border-emerald-600/50 text-emerald-400 bg-emerald-900/20' : 'border-gray-700 text-gray-500 bg-gray-800/50'}`}>
                      {g}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 text-[9px] font-mono text-gray-600">
                  <span>ctx: {m.context}</span>
                  <span>{m.pricing}</span>
                  <span>⚡ {m.speed}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* By use case panel */}
      {topTab === 'by-usecase' && (
        <div className="grid grid-cols-2 gap-3">
          {USE_CASES.map(uc => (
            <div key={uc.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs font-semibold mb-3 flex items-center gap-2">
                <span>{uc.icon}</span>
                <span>{uc.title}</span>
              </div>
              {uc.items.map(item => (
                <div key={item.model} className="flex gap-2 mb-2 last:mb-0">
                  <div className="w-1 h-1 rounded-full bg-gray-600 flex-shrink-0 mt-1.5" />
                  <div>
                    <div className="text-[10px] font-mono font-medium text-white">{item.model}</div>
                    <div className="text-[9px] font-mono text-gray-500">{item.why}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Resources panel */}
      {topTab === 'resources' && (
        <div className="space-y-6">
          {Object.entries(RESOURCES).map(([section, cards]) => (
            <div key={section}>
              <div className="text-xs font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {section}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {cards.map(card => (
                  <a
                    key={card.name}
                    href={card.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-3 block transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{card.icon}</span>
                      <span className="text-xs font-semibold">{card.name}</span>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400 leading-relaxed mb-2">{card.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full ${TAG_STYLES[card.tag]}`}>{card.tag}</span>
                      <span className="text-[9px] font-mono text-gray-600">{card.url}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
