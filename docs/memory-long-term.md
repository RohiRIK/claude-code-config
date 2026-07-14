# Layer 4 — Long-Term Memory (LTM) — Historical Reference

> ⚠️ **MOVED** — The LTM implementation now lives in **[RohiRIK/OpenLtm](https://github.com/RohiRIK/OpenLtm)**.
> This document is preserved as historical context. For current implementation details, setup guides, and troubleshooting, see the plugin repo.
> For the integration boundary between this repo and the LTM plugin, see [`docs/LTM_MIGRATION.md`](LTM_MIGRATION.md).

---

# Long-Term Memory (LTM) — Architecture & Process Guide (Historical)

> How the SQLite-backed LTM system works, what each piece does, and why it was designed this way.
>
> The auto-generated memory dump lives at `docs/memory-long-term-dump.md` — do not confuse the two.

---

## Overview

```
  Claude Code Sessions          Any MCP Client
  (+ other MCP clients)         (Cursor/Windsurf/etc.)
         |                              |
         v                              v
  +------+-------+  PreCompact   +-------------------+
  |    Hooks     | ------------> | context-summary.md |
  |  (4 hooks)   | <------------ | (human-readable)   |
  +------+-------+  SessionStart +-------------------+
         |                              |
         | read / write          MCP tools/resources
         v                              |
  +------+-------+              +-------+-------+
  |   ltm.db     | <----------- | mcp-server.ts |
  | (SQLite WAL) |  (STDIO MCP) | ltm:// server |
  +------+-------+              +---------------+
         |
    +----+----+
    |         |
    v         v
+-------+  +------------------+
| Bun   |  |  Janitor Agent   |
| API   |  |  (4-stage pipe)  |
| :7331 |  +------------------+
+---+---+
    |  WebSocket + REST
    v
+---+-------------------+
|  Next.js Graph UI     |
|  :7332                |
|  / /project /settings |
|  /pending             |
+-----------------------+
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

**Singleton pattern:** `shared-db.ts` exports one `Database` instance with WAL mode. All modules import this instance — never open their own connection. Prevents WAL file conflicts on macOS.

---

## Core Modules

- **`memory/db.ts`** — CRUD helpers: `learn()`, `recall()`, `getContextMerge()`, `computeDecayScore()`, `decayMemories()`, `updateLastUsed()`. `getContextMerge()` and `recall()` filter `status=active` and sort by decay score (Schwartzian transform).
- **`memory/context.ts`** — Per-project context CRUD (goals, decisions, progress, gotchas)
- **`memory/migrate.ts`** — Idempotent schema migration runner. Safe to re-run on every server start.
- **`memory/mcp-server.ts`** — STDIO MCP server. Exposes all LTM primitives to any MCP-compatible client. Registered as `ltm` in `settings.json`. Toggle with `mcp.enabled` in `config.json`.

---

## Server (`memory/server.ts`)

Bun HTTP + WebSocket server on **port 7331**. The Next.js graph app proxies `/api/*` here.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/stats` | Memory counts, project count, session count |
| `GET` | `/api/graph` | Full graph data (nodes + links) for D3 |
| `GET` | `/api/tags` | All tags with memory counts |
| `GET` | `/api/projects` | Project list with memory/context counts |
| `GET` | `/api/project/:name` | Project detail + related memories |
| `GET` | `/api/memory/:id` | Single memory with relations |
| `GET` | `/api/search?q=` | FTS5 full-text search |
| `GET/PUT` | `/api/settings` | Read or bulk-update settings |
| `GET` | `/api/settings/models` | Available models per provider |
| `POST` | `/api/settings/verify` | Verify API key; persists key inline |
| `GET` | `/api/pending` | Janitor suggestions awaiting review |
| `POST` | `/api/pending/:id/approve` | Approve a janitor suggestion |
| `POST` | `/api/pending/:id/reject` | Reject a janitor suggestion |
| `POST` | `/api/janitor/run` | Trigger a manual janitor pass |
| `WS` | `ws://localhost:7331` | Push graph updates to connected clients |

---

## Graph UI (`memory/graph-app/`)

Next.js 15 app on **port 7332**. Dev: `bun dev --port 7332` with `NEXT_PUBLIC_WS_URL=ws://localhost:7331`.

Pages: `/` (D3 force graph + sidebar), `/project/[name]` (drill-down), `/settings`, `/pending`

**D3 layout:** neural-network style. Link strength varies by type: `context_of`=0.04, `project_scope`=0.25, relations=0.6. Charge=-80, alphaDecay=0.025. Zoom-to-fit on simulation end.

---

## Janitor Pipeline (`memory/janitor/`)

```
  /api/janitor/run  (manual)
  or interval timer (ltm.janitor.intervalMinutes)
          |
          v
  +-------+-------+
  |  1. DECAY     |  unused memories lose confidence over time
  |               |  grace period -> rate * days -> archive at min
  +-------+-------+
          |
          v
  +-------+-------+
  |  2. PROMOTE   |  project memories with high importance+confirms
  |               |  -> promoted to global scope (project_scope=NULL)
  +-------+-------+
          |
          v
  +-------+-------+
  |  3. DEDUP     |  embed all active memories via provider
  |               |  cosine similarity > threshold
  |               |  -> LLM merges pair into one canonical memory
  +-------+-------+
          |
          v
  +-------+-------+
  |  4. SUPERSEDES|  walk memory_relations for type=supersedes
  |               |  -> archive the superseded originals
  +---------------+
          |
          v
  suggestions -> /pending UI (approve / reject)
```

**Stage details:**

1. **Decay** — Memories not confirmed in `ltm.decay.graceDays` (default 30) start losing confidence at `ltm.decay.rate` per day (default 0.02). At `ltm.decay.minConfidence` (default 0.2): archived, not deleted.
2. **Promote** — Project-scoped memories with importance ≥ `ltm.promote.minImportance` (default 3) and confirmed ≥ 2× are elevated to global.
3. **Dedup** — Embeds all active memories. Cosine similarity above `ltm.dedup.threshold` (default 0.92) triggers an LLM merge.
4. **Supersedes** — Walks `memory_relations` for `type=supersedes`, archives the original memories.

---

## Provider System (`memory/janitor/providers/`)

```
  EmbeddingProvider interface        LLMProvider interface
  +----------------------+           +-------------------+
  | embed(texts[])       |           | chat(messages[])  |
  | verify()             |           | verify()          |
  +----------+-----------+           +--------+----------+
             |                                |
   +---------+--------+             +---------+--------+
   | gemini / openai  |             | gemini / openai  |
   | cohere / ollama  |             | anthropic / cohere|
   | openrouter       |             | openrouter/ollama |
   +------------------+             +------------------+

  Shared utils (providers/utils.ts):
  - makeApiKeyGetter(settingKey, envVar, providerName)
  - makeModelGetter(settingKey)
  - httpErrorResult(res) -> { ok: false, error: string }
```

| Provider | Embed | LLM | API Key Setting |
|---|---|---|---|
| Gemini | yes | yes | `ltm.gemini.apiKey` |
| OpenAI | yes | yes | `ltm.openai.apiKey` |
| Anthropic | no | yes | `ltm.anthropic.apiKey` |
| Cohere | yes | yes | `ltm.cohere.apiKey` |
| OpenRouter | yes | yes | `ltm.openrouter.apiKey` |
| Ollama | yes | yes | *(base URL, no key)* |

---

## API Key Verify Flow

```
  User pastes API key into /settings
          |
          | onPaste -> setTimeout(verify, 50)
          | (draftRef ensures fresh value despite React state delay)
          v
  +-------+-------+
  | SettingsForm  |  shows "Verifying..." spinner
  +-------+-------+
          |
          | POST /api/settings/verify
          | body: { provider: "openai", key: "sk-..." }
          v
  +-------+-------+
  | server.ts     |
  |               |  1. setSetting(apiKeySettingKey, key)  <- persists inline
  |               |  2. PROVIDER_VERIFY_MAP[provider]      <- O(1) lookup
  +-------+-------+
          |
          | provider.verify()
          v
  +-------+-------+
  | Provider API  |  1-token dummy request
  +-------+-------+
          |
     +----+----+
     |         |
  ok: true   ok: false
     |         |
     v         v
  green      red border
  checkmark  "Invalid key"
  models     models stay
  unlocked   disabled
```

---

## Hooks Integration — Session Context Flow

```
  Session opens in Claude Code
          |
          v
  +-------+---------+
  | SessionStart    |
  | hook fires      |
  +-------+---------+
          |
          | resolveProject(cwd) -> registry.json -> project name
          v
  +-------+---------+
  | Read ltm.db     |
  |                 |  getContextMerge(project):
  |                 |  - globals (importance≥4, status=active)
  |                 |    sorted by computeDecayScore() DESC
  |                 |  - project-scoped (importance≥3, status=active, LIMIT 15)
  |                 |    sorted by computeDecayScore() DESC
  |                 |  - updateLastUsed() called on all returned IDs
  |                 |  getItems(project, 'goal')
  |                 |  getItems(project, 'decision')
  |                 |  getItems(project, 'progress', 3)  -- last 3
  |                 |  getItems(project, 'gotcha')
  +-------+---------+
          |
          | stdout -> Claude Code injects as background context
          v
  +-------+---------+
  | Claude sees:    |
  | ## Restored     |
  | Project Context |
  | goal / decisions|
  | progress / LTM  |
  +-----------------+

  During session:
  UpdateContext hook  -> appends progress items after each tool use
  EvaluateSession     -> extracts patterns at session end -> learn()

  Session ends:
  Cleanup hook        -> decayMemories() -> status='deprecated' for score < 0.25
                      -> setSetting('decay_last_run') -> logHook() to hooks.log

  Before /compact:
  PreCompact hook     -> reads DB -> writes context-summary.md (60 lines max)
                      -> injected at NEXT SessionStart as fallback
```

**Hook reads use `context.ts` helpers, never raw SQL.** Only `server.ts` and janitor use direct SQL.

---

## Settings Keys Reference

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
| `decay_last_run` | — | ISO timestamp of last `decayMemories()` run (set by Cleanup hook) |
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

> ⚠️ **Paths moved** — The LTM system now lives in [RohiRIK/OpenLtm](https://github.com/RohiRIK/OpenLtm). Server source is at `<plugin-root>/memory/server.ts` and `<plugin-root>/memory/graph-app/`. For current startup commands, see the plugin repo.

Use `/ltm-server start` in Claude Code — opens both the API server (:7331) and the Next.js graph UI (:7332) in tmux automatically.

### MCP Server (for external clients)

The `ltm` MCP server is installed via `claude plugin marketplace add ltm` and starts automatically when Claude Code opens. Registration is managed by the plugin — no manual `settings.json` entry needed.

For external clients (Cursor, Windsurf, Claude Desktop), refer to the plugin repo for the current server command path.

**Available tools:** `ltm_recall` · `ltm_learn` · `ltm_relate` · `ltm_forget` · `ltm_context` · `ltm_graph` · `ltm_context_items`

**Available resources:** `memory://globals` · `memory://recent` · `memory://tags` · `memory://project/{name}`

**STDIO gotcha:** Never use `console.log()` in `mcp-server.ts` — stdout is reserved for the JSON-RPC protocol. Use `console.error()` for diagnostics only.

---

## Design Decisions

| Decision | Reason |
|---|---|
| SQLite | Zero-dependency, single-file, WAL mode — perfect for local dev tool with <100k rows |
| Singleton DB connection | macOS WAL creates `-wal`/`-shm` files that corrupt with two writers |
| Bun for server | Native `bun:sqlite`, built-in WebSocket, fast startup — no extra deps |
| Inline key persistence on verify | Eliminates client PUT→POST double round-trip; key saved regardless of verify outcome |
| `draftRef` in SettingsForm | `onPaste` fires before React commits state; ref is always current, closure is not |
| FTS5 for search | Replaces LIKE scans — full-text index on memory content |
| Static imports in server.ts | Replaces per-request dynamic imports for providers; `PROVIDER_VERIFY_MAP` gives O(1) lookup |
| Decay in Cleanup hook (not just janitor) | Every session end guarantees decay runs without requiring janitor schedule; janitor handles heavier embed/dedup pipeline |
| STDIO transport for MCP server | Local only, single client, zero network overhead — correct for a personal tool; SSE/HTTP transport would add complexity with no benefit |
| MCP server as pure adapter layer | `mcp-server.ts` delegates 100% to existing `db.ts`/`context.ts`/`graph.ts` — no reimplementation. Any logic fix applies to both hooks and MCP clients automatically |
