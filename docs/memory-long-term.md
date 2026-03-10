# Long-Term Memory (LTM) — Architecture & Process Guide

> How the SQLite-backed LTM system works, what each piece does, and why it was designed this way.

---

## Overview

The LTM system persists learned insights, project context, and architectural decisions across Claude Code sessions. It replaces ephemeral in-context notes with a queryable SQLite database at `~/.claude/memory/ltm.db`.

```
Sessions → Hooks → ltm.db → Graph UI (http://localhost:7332)
                          ↳ Janitor Pipeline (decay · promote · dedup · supersedes)
```

---

## Database (`memory/ltm.db`)

Managed by `memory/schema.sql` and the shared singleton in `memory/shared-db.ts`.

| Table | Purpose |
|---|---|
| `memories` | Global learned facts (patterns, gotchas, preferences) |
| `context_items` | Per-project goals, decisions, progress, gotchas |
| `memory_relations` | Typed edges between memories (supersedes, related_to, etc.) |
| `settings` | Key-value store for all LTM + janitor configuration |
| `projects` | Registered projects from `registry.json` |
| `sessions` | Session log with auto-naming |

**Singleton pattern:** `shared-db.ts` exports a single `Database` instance with WAL mode enabled. All modules (`db.ts`, `context.ts`, `server.ts`, janitor) import this one instance — never open their own connection. This prevents WAL file conflicts on macOS.

---

## Core Modules

### `memory/db.ts`
CRUD helpers for `memories` table. Key exports:
- `learn(text, category, importance, tags, projectScope?)` — insert a memory
- `getItems(project, category)` — fetch context_items by project + type
- `searchMemories(query)` — FTS5 full-text search across memory content
- `getContextMerge(project)` — returns globals (importance=5) + scoped memories for session injection

### `memory/context.ts`
Per-project context CRUD (goals, decisions, progress, gotchas). Used by hooks for session injection and compaction.

### `memory/migrate.ts`
Idempotent schema migration runner. Executes `schema.sql` + any `ALTER TABLE` statements that don't exist yet. Safe to re-run on every server start.

---

## Server (`memory/server.ts`)

Bun HTTP + WebSocket server on **port 7331**. The Next.js graph app proxies `/api/*` here.

### Key Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/stats` | Memory counts, project count, session count |
| `GET` | `/api/graph` | Full graph data (nodes + links) for D3 |
| `GET` | `/api/tags` | All tags with memory counts |
| `GET` | `/api/projects` | Project list with memory/context counts |
| `GET` | `/api/project/:name` | Project detail + related memories |
| `GET` | `/api/memory/:id` | Single memory with relations |
| `GET` | `/api/search?q=` | FTS5 full-text search |
| `GET` | `/api/settings` | All settings as key-value map |
| `PUT` | `/api/settings` | Bulk update settings |
| `GET` | `/api/settings/models` | Available models per provider (`embedModels`, `llmModels`) |
| `POST` | `/api/settings/verify` | Verify API key for a provider; persists key inline |
| `GET` | `/api/pending` | Janitor suggestions awaiting review |
| `POST` | `/api/pending/:id/approve` | Approve a janitor suggestion |
| `POST` | `/api/pending/:id/reject` | Reject a janitor suggestion |
| `POST` | `/api/janitor/run` | Trigger a manual janitor pass |
| `WS` | `ws://localhost:7331` | Push graph updates to connected clients |

---

## Graph UI (`memory/graph-app/`)

Next.js 15 app on **port 7332**. Dev: `bun dev --port 7332` with `NEXT_PUBLIC_WS_URL=ws://localhost:7331`.

### Pages
- `/` — D3 force graph with sidebar (projects + tags), FilterBar, NodeLegend, ⌘K spotlight
- `/project/[name]` — Project drill-down with MiniGraph radial layout
- `/settings` — Provider config + decay/janitor tuning (SettingsForm)
- `/pending` — Review janitor suggestions (approve/reject)

### Graph layout (D3)
- Neural-network style: link strength varies by type (`context_of`=0.04 float, `project_scope`=0.25, relations=0.6)
- Charge: -80 uniform, alphaDecay: 0.025
- Zoom-to-fit fires on simulation `"end"`
- Node types: `memory` · `context` · `project` — each with its own color (see `lib/nodeColors.ts`)

---

## Janitor Pipeline (`memory/janitor/`)

Background agent that maintains memory health. Runs manually via `/api/janitor/run` or on a configurable interval (`ltm.janitor.intervalMinutes`).

### 4 Stages

```
1. Decay     — lower confidence on unused memories
2. Promote   — elevate important project memories to global
3. Dedup     — find near-duplicates via embeddings + LLM merge
4. Supersedes — mark merged originals as superseded
```

#### 1. Decay (`decay.ts`)
- Memories not confirmed in `ltm.decay.graceDays` (default 30) start losing confidence
- Rate: `ltm.decay.rate` per day (default 0.02)
- At `ltm.decay.minConfidence` (default 0.2): memory archived (not deleted)

#### 2. Promote (`promote.ts`)
- Project-scoped memories with importance ≥ `ltm.promote.minImportance` (default 3) and confirmed ≥ 2× are candidates
- Promoted memories get `project_scope = NULL` (become global)

#### 3. Dedup (`dedup.ts`)
- Embeds all active memories via the configured embedding provider
- Cosine similarity above threshold → LLM merges pair into one canonical memory
- Originals marked with `supersedes` relation

#### 4. Supersedes (`supersedes.ts`)
- Walks `memory_relations` for type `supersedes`
- Archives the superseded memory, updates references

---

## Provider System (`memory/janitor/providers/`)

Pluggable embedding + LLM backends. All providers implement the same interfaces from `types.ts`.

### Interfaces

```ts
interface EmbeddingProvider {
  name: string;
  embed(input: EmbedInput): Promise<EmbedResult>;
  verify(): Promise<{ ok: boolean; error?: string }>;
}

interface LLMProvider {
  name: string;
  chat(input: ChatInput): Promise<ChatResult>;
  verify(): Promise<{ ok: boolean; error?: string }>;
}
```

### Available Providers

| Provider | Embed | LLM | API Key Setting |
|---|---|---|---|
| Gemini | ✅ | ✅ | `ltm.gemini.apiKey` |
| OpenAI | ✅ | ✅ | `ltm.openai.apiKey` |
| Anthropic | ❌ | ✅ | `ltm.anthropic.apiKey` |
| Cohere | ✅ | ✅ | `ltm.cohere.apiKey` |
| OpenRouter | ✅ | ✅ | `ltm.openrouter.apiKey` |
| Ollama | ✅ | ✅ | *(base URL, no key)* |

### Shared utils (`providers/utils.ts`)
- `makeApiKeyGetter(settingKey, envVar, providerName)` — reads from settings DB or env var, throws with helpful message if missing
- `makeModelGetter(settingKey)` — reads model name from settings DB
- `httpErrorResult(res)` — async, returns `{ ok: false, error: "<status>: <body>" }`

---

## Hooks Integration

The LTM DB is read/written by four Claude Code hooks:

| Hook | Trigger | What it does |
|---|---|---|
| `SessionStart` | Session open | Injects goal + last 3 progress + decisions + importance-5 globals into context |
| `PreCompact` | Before /compact | Writes `context-summary.md` from DB for next session |
| `EvaluateSession` | Session end | Extracts patterns, stores new memories via `learn()` |
| `UpdateContext` | After each tool use | Appends progress items, updates goal if changed |

**Hook reads use `context.ts` helpers, never raw SQL.** Only `server.ts` and janitor use direct SQL.

---

## Settings Keys Reference

All settings live in the `settings` table. Defaults are defined in `providers/types.ts` → `SETTING_DEFAULTS`.

| Key | Default | Purpose |
|---|---|---|
| `ltm.embed.provider` | `gemini` | Active embedding provider |
| `ltm.llm.provider` | `gemini` | Active LLM provider |
| `ltm.decay.graceDays` | `30` | Days before decay starts |
| `ltm.decay.rate` | `0.02` | Confidence lost per idle day |
| `ltm.decay.minConfidence` | `0.2` | Archive threshold |
| `ltm.promote.minImportance` | `3` | Minimum importance to promote |
| `ltm.janitor.intervalMinutes` | `0` | Auto-run interval (0 = off) |
| `ltm.dedup.threshold` | `0.92` | Cosine similarity threshold |
| `ltm.gemini.apiKey` | — | Gemini API key |
| `ltm.gemini.embedModel` | `text-embedding-004` | Gemini embed model |
| `ltm.gemini.llmModel` | `gemini-1.5-flash` | Gemini LLM model |
| `ltm.openai.apiKey` | — | OpenAI API key |
| `ltm.openai.embedModel` | `text-embedding-3-small` | OpenAI embed model |
| `ltm.openai.llmModel` | `gpt-4o-mini` | OpenAI LLM model |
| `ltm.anthropic.apiKey` | — | Anthropic API key |
| `ltm.anthropic.llmModel` | `claude-haiku-4-5-20251001` | Anthropic LLM model |
| `ltm.cohere.apiKey` | — | Cohere API key |
| `ltm.cohere.embedModel` | `embed-v4.0` | Cohere embed model |
| `ltm.cohere.llmModel` | `command-r-plus` | Cohere LLM model |

---

## Starting the System

```bash
# Start the Bun API server (port 7331)
bun ~/.claude/memory/server.ts &

# Start the Next.js graph UI (port 7332)
cd ~/.claude/memory/graph-app
NEXT_PUBLIC_WS_URL=ws://localhost:7331 bun dev --port 7332

# Or use the /ltm-server skill
# → opens both automatically in tmux
```

Or use `/ltm-server start` in Claude Code.

---

## Design Decisions

**Why SQLite?** Zero-dependency, single-file, WAL mode gives concurrent reads with one writer. Perfect for a local dev tool with <100k rows.

**Why a singleton DB connection?** macOS WAL mode creates `-wal` and `-shm` files that corrupt if two processes write simultaneously. One connection eliminates this entirely.

**Why Bun for the server?** Native `bun:sqlite`, built-in WebSocket support, fast startup — no extra dependencies.

**Why inline key persistence on verify?** Eliminates the client PUT→POST double round-trip. The verify endpoint accepts `{ provider, key }`, calls `setSetting()` before verifying, so the key is saved regardless of verify outcome.

**Why `draftRef` in SettingsForm?** React's `onPaste` fires before the synthetic event updates state. A `setTimeout(() => verify(), 50)` would read stale closure state. `draftRef` is kept in sync by `handleChange` so the verify always reads the just-typed value.
