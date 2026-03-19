# Changelog

All notable changes to this global Claude Code configuration.

---

## 2026-03-19 — LTM MCP Server

### memory/mcp-server.ts (new)
- **STDIO MCP server** exposing the full LTM system to any MCP-compatible client (Cursor, Windsurf, Claude Desktop, etc.)
- **7 tools**: `ltm_recall`, `ltm_learn`, `ltm_relate`, `ltm_forget`, `ltm_context`, `ltm_graph`, `ltm_context_items` — all delegate to existing `db.ts` / `context.ts` / `graph.ts` functions with no reimplementation
- **4 resources**: `memory://globals` (importance=5 memories), `memory://recent` (last 20), `memory://tags` (tag counts), `memory://project/{name}` (ResourceTemplate for per-project memories)
- **3 prompts**: `recall_before_task`, `learn_after_session`, `graph_reason`
- Fire-and-forget `notifications/message` logging on `memory_stored` and `graph_traversal` events

### settings.json
- Added `ltm` entry to `mcpServers` — `bun run ~/.claude/memory/mcp-server.ts`
- Restart Claude Code to pick up the new server

### config.json + config.schema.json
- Added `mcp.enabled` boolean flag (default `true`) to toggle the server without removing the settings entry

### memory/package.json
- Added `@modelcontextprotocol/sdk` and `zod` dependencies

---

## 2026-03-17 — Graph UI Polish: Unified Search, Project Names, Context Sort

### memory/graph-app/components/FilterBar.tsx
- **Unified search bar**: owns `semanticMode` state internally — one input switches between keyword and semantic modes with an inline toggle button; semantic results appear as a dropdown below the bar
- Removed the separate `SemanticSearch` panel and the `Semantic` toggle button from `page.tsx`

### memory/graph-app/components/ProjectList.tsx
- **Short project names**: displays `p.label.split("/").pop()` in the list; full path shown in `title` tooltip

### memory/graph-app/components/Sidebar.tsx + server.ts + lib/api.ts
- **Sort context items by date**: server now returns `{ content, created_at }[]` per category; `ProjectPanel` shows relative creation date on each item; "↓ newest / ↑ oldest" toggle appears when a tab has 2+ items (defaults to newest first)

### memory/graph-app/components/ImportanceStars.tsx (new)
- Shared component extracted from `SemanticSearch` — renders 5-star importance indicator; used in `FilterBar` semantic results and `Sidebar`

---

## 2026-03-17 — Graph UI Improvements + Sidebar Redesign

### memory/graph-app/components/Graph.tsx
- **Hover tooltips**: floating DOM div (zero React re-renders) shows category, label, content preview, importance stars on mouseenter
- **Important node labels**: nodes with importance ≥ 4 always show abbreviated label (`node-label-important`); lower-importance nodes keep zoom-fade behavior
- **Search result highlighting**: `highlightedIds` prop — matched nodes get blue stroke + `glow-search` SVG filter; non-matches dim to 0.15 opacity
- **Graph toolbar**: `⊞ Fit` and `↺ Reset` buttons (top-right, backdrop-blur); `GraphHandle` extended with `fitToScreen()` + `resetSimulation()`; simulation stored in `simRef`; `fitBounds()` extracted as named function called by both `simulation.on("end")` and toolbar
- Removed `<title>` appends (conflicted with custom tooltips); tooltip built with safe DOM methods (no innerHTML)

### memory/graph-app/app/page.tsx
- Derives `highlightedIds` from `searchResults` when non-empty, passes to Graph
- Toolbar buttons wired to `graphRef.current?.fitToScreen()` / `resetSimulation()`

### memory/graph-app/app/pending/page.tsx
- Cards now `line-clamp-3` by default; "Show more ↓" / "Show less ↑" toggle for content > 120 chars
- `expandedIds` state uses immutable Set pattern

### memory/graph-app/components/Sidebar.tsx (full redesign)
- Accent-colored gradient header tinted to node type/category color
- Content in bordered card (`bg-gray-800/40`)
- `CategoryBadge` using existing `categoryBadgeColors`; context types (goal/decision/gotcha/progress) each get distinct color
- Confidence bar: green/yellow/red by threshold
- Relative timestamps ("7d ago", "today") with full ISO on hover via `RelativeTime` component
- Project name is clickable link → `/project/[name]`
- Metadata in `MetaRow` key-value table
- Relations: directional arrows (↗/↙) + italic type label
- Project panel: tinted header card + colored tabs with item counts per context type

---

## 2026-03-17 — Memory Health Dashboard Redesign

### memory/graph-app/app/health/page.tsx (redesigned)
- **Global health banner**: LTM score (0–100 weighted avg), pills for Active / Superseded / At-Risk / Projects, mini per-project score strip
- **Action Items section**: neglected/needs-attention projects with View link, at-risk memories with Boost, superseded memories with 2-step Delete confirmation ("Delete" → "Sure?")
- **2-column project grid**: healthy cards compact (score + metadata only), unhealthy cards expand with metric bars
- Removed: standalone confidence distribution chart, dead "no at-risk" tombstone section
- Extracted `scoreTextColor`, `scoreBgColor`, `statusBadgeColor`, `statusIcon` helpers; single-pass `overallScore` reduce; `projectStatusCounts` computed once above JSX

### memory/server.ts
- `GET /api/health/projects`: fixed epoch-0 timestamp handling — `last_used_at <= '1970-01-02'` treated as NULL for freshness/activity/stale calculations
- `GET /api/health/superseded` (new): returns all memories with `status = 'superseded'` for review and deletion

### memory/graph-app/lib/types.ts
- Added `SupersededMemory` interface (Phase 5)

### memory/graph-app/lib/api.ts
- Added `api.supersededMemories()` → `GET /health/superseded`

### memory/graph-app/app/layout.tsx + pending/page.tsx + settings/page.tsx
- Fixed scroll bug: `overflow-hidden` on layout wrapper clipped all pages to viewport height; replaced with `min-h-0` + `overflow-y-auto` per scrollable page

---

## 2026-03-16 — Semantic LTM Retrieval (Embedding-Based)

### memory/embeddings.ts (new)
- Provider-agnostic embedding utilities: `embedText()`, `cosineSimilarity()`, `vecToBlob/blobToVec`, `embedMemory()`, `backfill()`
- Reads provider + API key from `ltm.db` settings table (same source as graph UI) — no env vars needed
- Supports: **gemini** | openai | openrouter | cohere | ollama — switched via `ltm.embed.provider` setting
- Config batch-fetched in one `IN (...)` query and cached per process (O(1) for backfill)
- Gemini client cached and revalidated against apiKey
- `--backfill` CLI: embeds all memories with `embedding IS NULL` in batches of 20

### memory/db.ts
- Added `getSimilarMemories(db, queryVec, opts)` — cosine similarity ranked recall with SQL LIMIT
- `learn()` now calls `embedMemory()` fire-and-forget after insert (never blocks, logs errors)

### hooks/SessionStart/SessionStart.ts
- `buildLtmSection()` now embeds session summary and uses `getSimilarMemories()` for semantic injection
- Falls back to importance+decay ranking when no provider configured
- Logs `[SessionStart] Semantic LTM: N globals, N scoped` to stderr on each session start

### memory/migrations/003_embedding_index.sql (new)
- Partial index on `memories(id) WHERE embedding IS NOT NULL`

---

## 2026-03-15 — Docs, README & CLAUDE.md Overhaul

### CLAUDE.md
- Redesigned for token efficiency: 51 → 36 lines (~30% reduction)
- Updated workflow line to include `/capture` after implement
- Replaced stale commands (`/tdd`, `/code-review`) with `/capture`, `/decay-report`, `/hook-doctor`
- Added `Cleanup` hook to hooks list
- Added `## Context-Mode MCP` section

### README.md
- Added `/capture` to Layer 1 ASCII flow diagram
- Added `/capture`, `/decay-report`, `/hook-doctor` to Quick-Reference table
- Removed `/tdd`, `/code-review`, `/e2e`, `/build-fix`, `/refactor-clean` from Quick-Reference
- Added `Cleanup` hook + session-end decay note to LTM section
- Updated "Last updated" to 2026-03-15

### docs/workflow-daily.md
- Added `/capture` step to ASCII flow box
- Added `### /capture` step description in Step by Step section
- Added `/capture` to All Commands table

### docs/memory-long-term.md
- Updated `db.ts` Core Modules description with new decay functions
- Updated `getContextMerge()` flow: `status=active` filter + decay sort + `updateLastUsed()`
- Added Cleanup hook to session flow diagram
- Added `decay_last_run` to Settings Keys Reference
- Added decay-in-Cleanup to Design Decisions table

### docs/CHANGELOG.md (deleted)
- Removed — single source of truth is root `CHANGELOG.md`

---

## 2026-03-15 — Memory Decay Scoring + Relevance-Ranked Injection

### memory/db.ts
- `computeDecayScore(memory)`: score = importance × confidence × 0.5^(days/halfLife)
- Half-lives: imp5=∞, imp4=180d, imp3=90d, imp2=30d, imp1=14d
- `decayMemories()`: soft-deprecates active memories with score < 0.25
  (protected: importance=5 or confirm_count≥5; deprecated = status change only, never deleted)
- `updateLastUsed(ids[])`: batched UPDATE last_used_at on every recall/getContextMerge
- `getContextMerge()` and `recall()`: now filter status=active, sort by decay score
  (Schwartzian transform — one score per item, not O(n log n) recomputation)
- DEPRECATION_THRESHOLD (0.25) and HALF_LIVES at module scope

### hooks/Cleanup/Cleanup.ts
- Runs `decayMemories()` at session end; records `decay_last_run` in settings table
- Logs result to `~/.claude/logs/hooks.log` via `logHook()`

### commands/decay-report.md (new)
- `/decay-report` — shows active/deprecated counts, 5 score buckets, top 5 at-risk memories,
  last decay run timestamp; includes one-liner to trigger decay manually

### memory/db.test.ts (new)
- 6 unit tests covering: importance=5 no-decay, fresh score, old score, recency tie-breaking,
  confidence proportionality, 90-day half-life accuracy

### memory/package.json
- Added `"test": "bun test db.test.ts"` — scopes bun test to root-level tests, avoids
  Playwright spec collision in graph-app/

---

## 2026-03-15 — Hook Error Handling + /capture Command

### hooks/lib/hookLogger.ts (new)
- Structured JSONL logger writing to `~/.claude/logs/hooks.log`
- 500KB auto-rotation (keeps last 300KB); module-level `_dirEnsured` flag avoids repeated I/O on hot path
- Fallback-safe — logger failure never crashes the hook that calls it
- Exports `logHook(hook, level, msg, detail?, durationMs?)` and `runWithLogging(hook, fn)`

### hooks/lib/hookDoctor.ts + commands/hook-doctor.md (new)
- `/hook-doctor` slash command: checks all registered hooks exist on disk, reports error/warn counts from last 24h per hook, flags hooks with ≥3 errors as 🔴 unhealthy
- Imports `LogEntry` type from hookLogger (no duplication); uses `hookName()` helper

### 5 hooks updated: SessionStart, PreCompact, UpdateContext, EvaluateSession, SuggestCompact
- All `console.error` error/warning calls now also write to `hooks.log` via `logHook()`
- Info-level success events (context injected, DB updated) now logged to file only (no stderr noise)

### commands/capture.md (new)
- `/capture <type> "<content>"` — writes to both project context DB and global LTM in one command
- Types: `decision`, `gotcha`, `progress`, `pattern`, `goal` — each maps to correct context type + LTM category + importance
- Runs both writes in parallel; never asks clarifying questions

### commands/simplify.md (removed)
- Deleted redundant user-defined `/simplify` command — built-in skill (3-agent review) is the canonical version

---

## 2026-03-15 — LtmServer Skill: Port Fix + Robust Start/Stop

### skills/LtmServer/SKILL.md
- Fixed stale quick-reference: UI port is `:7332` (Next.js), not `:7331`
- Updated UI source path to `memory/graph-app/` (removed old `graph-ui/index.html`)
- Added `user-invocable: false` — hides `/LtmServer` from autocomplete, keeping only `/ltm-server`
- Bumped to v1.1.0

### skills/LtmServer/Workflows/Start.md
- Added **Step 0** — kills stale PID, clears ports `:7331`/`:7332`, kills `ltm-ui` tmux session
- Next.js dev server now starts in tmux (`ltm-ui` session) automatically
- Browser opens `:7332` (not `:7331`)
- Prod mode open URL corrected to `:7332`

### skills/LtmServer/Workflows/Stop.md
- Full teardown: kills by PID + `lsof` port kill for `:7331`/`:7332` + tmux session kill

---

## 2026-03-11 — Rules Section Improvements: Memory Integration + CodingStandards Wiring

### Rules Files Modified (8 files)
- **coding-style.md** — Added 4-row CodingStandards load table (TS/Python/Bash/PS) + Memory Integration section
- **session-context.md** — Added short-term vs long-term decision table; clarified context_items vs memories tiers
- **testing.md** — Added Memory Integration: recall test patterns before, learn gotchas/patterns after
- **git-workflow.md** — Added Memory Integration: recall PR conventions before, learn project style after
- **agents.md** — Added Memory Integration: recall orchestration patterns, learn successful workflows
- **security.md** — Added Memory Integration: recall security gotchas before review, learn vulns at importance=5
- **patterns.md** — Expanded from 16→24 lines; added mandatory Memory-First Rule at the top
- **workflow.md** — Added: load Prompting skill when writing prompts or instructions

### Design Principles Applied
- Consistent "recall before, learn after" pattern across all rules
- Each LTM addition is ≤4 lines as `## Memory Integration` section
- Short-term (hooks auto-manage) vs long-term (explicit `/learn`) distinction made explicit
- No rule file exceeds 100 lines

---

## 2026-03-10 — Phase 2.1: Multi-Provider Expansion + Settings UI Redesign

### New Providers
- **OpenAI** — `openaiEmbedding` (text-embedding-3-*) + `openaiLLM` (GPT-4o family)
- **Anthropic** — `anthropicLLM` (Claude family; no embedding API)
- **Cohere** — `cohereEmbedding` (embed-v4.0) + `cohereLLM` (command-r-plus)
- All three use shared `janitor/providers/utils.ts` factory helpers (`makeApiKeyGetter`, `makeModelGetter`, `httpErrorResult`)
- `ProviderType` union now covers 6 providers: Gemini · OpenAI · Anthropic · Cohere · OpenRouter · Ollama

### Server (`memory/server.ts`)
- Static top-level imports for all 6 providers (replaces per-request dynamic imports)
- `PROVIDER_VERIFY_MAP` constant — O(1) lookup for verify route
- `/api/settings/verify` accepts `{ provider, key }` body — persists key via `setSetting()` inline (eliminates client PUT round-trip)
- `/api/settings/models` returns `embedModels` and `llmModels` keyed per provider

### Settings UI (`SettingsForm.tsx`) — full SaaS-form redesign
- **Smart conditional rendering**: only shows provider cards for currently-selected Embed or LLM provider
- **Inline API key verification**: paste → spinner → ✓ green / ✗ red, disabled model selects until verified
- **Model dropdowns**: replaced text inputs with `<select>` menus populated from `/api/settings/models`
- **`ProviderMeta` typed interface** with `ProviderColor` literal union; `accentMap`/`badgeMap` at module level
- **Stale-closure fix**: `draftRef` mirrors draft state — `verifyProvider` reads from ref so paste-triggered verify sees the just-typed key
- **Seed-once `useEffect`**: `initialized` ref guards against overwriting user edits on parent re-renders
- Removed dead `verifyTimers` ref and redundant `PUT /api/settings` before verify

### E2E Tests (13 passing)
- Rewrote full spec against D3 SVG selectors (`svg circle`, `g.node`, `.node-label-project`)
- `waitForFunction` instead of `waitForTimeout` for all async assertions
- `openSidebarViaNode` shared helper dispatches synthetic click via `evaluate()`

---

## 2026-03-09 — LTM Graph UX Overhaul

### Graph Layout
- Replaced rigid D3 force layout (fixed ring orbits) with organic neural-network style
- Link strength now varies per link type: `context_of` 0.04 (float loose), `project_scope` 0.25, memory relations 0.6
- Uniform charge -80, alphaDecay 0.025 (faster convergence)
- Zoom-to-fit fires on simulation `"end"` — all clusters visible on load
- Removed `forceRadial` (was causing perfect circular orbits)

### Visual
- Project nodes: glow filter (`feGaussianBlur`), color-matched stroke
- Memory node labels: always rendered, fade in at zoom ≥ 0.8x (cached D3 selection)
- Node project labels: below circle, always visible
- Removed arrow markers — cleaner edge rendering
- Edge colors by type: project_scope `#334155`, others `#1e3a5f`

### Sidebar (`ProjectList.tsx`)
- Projects and Tags both in collapsible left sidebar with chevron toggles
- Tags section: active count badge (`Tags · 3`), separate "clear" button (fixes nested `<button>` a11y issue)
- Tags sorted by memory count, sky-400 highlight when active
- Removed `TagFilterBar.tsx` (superseded)

### FilterBar
- ⌘K button moved into FilterBar (was invisible floating over dark canvas)
- Search debounced 200ms (`onSearch` in useEffect deps — fixes stale closure)
- Importance slider flanked by `1` and `5` end labels

### Other UX
- `NodeLegend.tsx` — collapsible color legend panel bottom-left of canvas
- Empty state when all projects hidden: "Show all projects" button
- Eye icon visibility: `opacity-30` at rest (was `opacity-0`)
- Show-all button uses state updater pattern (atomic localStorage write)
- Cached `.node-label-memory` D3 selection — no DOM query on zoom ticks
- Extracted `linkForce` variable — removed `as unknown as RawLink` cast

---

## 2026-03-09 — Phase 2: LTM Evolution — Janitor Agent + Intelligent Memory Management

### Features
- **Janitor sub-agent** (`memory/janitor/`) — autonomous memory maintenance running inside `server.ts`; four pipeline stages: decay, promote, dedup, supersedes
- **Memory decay** — unused memories lose confidence over time; auto-archive at configurable threshold (default 0.2)
- **Auto-promote** — `decision` and `gotcha` context items automatically elevate to global memories; links back via `memory_id`
- **Semantic dedup** — embedding vectors computed per memory; cosine similarity detection (threshold 0.85); LLM-powered merge proposals
- **Supersedes relations** — new/merged memories mark old ones as `superseded`; creates `supersedes` edge in knowledge graph
- **Pluggable providers** — Gemini, OpenRouter, Ollama for both embeddings and LLM; configured via settings UI
- **Settings UI** (`/settings`) — provider selection, model config, decay rate/window/threshold, dedup threshold, auto-run interval
- **Pending actions UI** (`/pending`) — review/approve/reject janitor suggestions before they take effect; live badge in StatsBar
- **Schema migration** — `shared-db.ts` runs idempotent ALTER TABLE migrations; adds `status`, `embedding`, `last_used_at` to memories; `memory_id`, `status` to context_items; creates `settings` table
- **Shared DB module** (`shared-db.ts`) — singleton DB instance shared by db.ts, context.ts, server.ts, and janitor; prevents dual WAL connections; includes settings CRUD helpers

### Fixes
- **Migration ordering** — `runMigrations()` now runs before `schema.sql` exec so ALTER-added columns exist before `CREATE INDEX` references them
- **SQLite non-constant default** — `last_used_at` ALTER uses constant default + backfill UPDATE (SQLite constraint)
- **`noUncheckedIndexedAccess` compliance** — 32 type errors fixed across janitor files; added `getDefault()` helper, extracted array locals with `!` assertions
- **`SQLQueryBindings` import** — `server.ts` query helpers now use correct `bun:sqlite` param type
- **Dead code removed** — unused `getContextData()` + `/api/context` route in `server.ts`
- **`server.ts` `getGraphData()`** — broken from 116 lines into 5 focused sub-helpers
- **Duplicate verify logic** in `ollama.ts` consolidated into shared `verifyModel()`
- **`.then()` chain** in `graph-app/lib/api.ts` `reload()` converted to `async/await`

### Schema Changes
```
memories:      + status (TEXT), embedding (BLOB), last_used_at (TEXT)
context_items: + memory_id (INT FK), status (TEXT)
+ settings table (key TEXT PK, value TEXT, updated_at TEXT)
+ memory_relations: 'supersedes' added to relationship_type
+ idx_memories_status, idx_memories_last_used
```

### Files (20 changed, +2720/-95)
- `memory/janitor/` — 8 new files (index, decay, promote, dedup, supersedes, embeddings, providers/*)
- `memory/shared-db.ts` — new shared DB singleton with migrations
- `memory/server.ts` — janitor routes, settings CRUD, pending actions, refactored graph query
- `memory/schema.sql` — Phase 2 columns and tables
- `memory/graph-app/` — settings page, pending page, SettingsForm, updated StatsBar/api/types
- `hooks/UpdateContext/` — removed direct promote call (janitor handles it now)

---

## 2026-03-09 — LTM graph 3 UX features + full SQLite LTM

### Features
- **Tag filter panel** (`TagFilterBar.tsx`) — scrollable chip row above the graph; clicking a tag dims all non-matching nodes to 15% opacity; "clear" resets in a single state write
- **⌘K Spotlight search** (`SpotlightModal.tsx`) — global keyboard shortcut opens FTS5-powered modal; keyboard nav (↑↓ Enter ESC); selecting a result zooms the D3 graph to that node and opens the Sidebar; ref-based keyboard handler only re-registers on `[open]` change
- **Project drill-down page** (`/project/[name]`) — clicking a project node navigates to a dedicated Next.js page with: header (name + counts), radial `MiniGraph` (static layout, no physics), context sections, scrollable memory cards
- **`lib/nodeColors.ts`** — shared `nodeColor()` and `nodeRadius()` extracted from `Graph.tsx`; used by Graph, MiniGraph, SpotlightModal, project page
- **`server.ts` `/api/project/:name`** — returns full project detail: context by type, memories with tags, context items, relations
- **E2E suite** — 11/11 Playwright tests passing; 3 new tests for tag filter, spotlight, project drill-down

### Fixes / Refactors
- **`server.ts`** — `truncate()` + `parseTags()` helpers eliminate 4 copy-pasted inline expressions
- **SQLite 999-var fix** — `getProjectDetail` relations query uses `IN (SELECT id FROM memories WHERE project_scope = ?)` subquery instead of doubled IN-list (hits SQLite limit at ~500 memories)
- **`page.tsx`** — `api.tags()` fetched once on mount, not on every WebSocket refresh
- **`Graph.tsx`** — `useImperativeHandle` deps `[]`; MiniGraph zoom handlers cleared before re-attach
- **`SpotlightModal.tsx`** — stale `setResults` after unmount prevented with `cancelled` flag

### Branches
- `main` → merged squash `24891fd`
- `snapshot/working-config-pre-ltm` → backup of main before SQLite LTM

---

## 2026-03-08 — SQLite LTM system + LTM graph visualizer v2

### Features
- **Native Bun SQLite LTM** (`memory/ltm.db`) — `schema.sql`, `db.ts`, `context.ts`, `dedup.ts`, `migrate.ts`; replaces JSON flat-file context
- **LTM graph API server** (`memory/server.ts`) — Bun.serve on :7331 with WebSocket live-reload; routes: `/api/graph`, `/api/stats`, `/api/tags`, `/api/memory/:id`, `/api/search` (FTS5), `/api/context/:project`, `/api/reload`
- **LTM graph UI** (`memory/graph-app/`) — Next.js 15 on :7332; D3 force graph with project/memory/context nodes; Sidebar, FilterBar, ProjectList, StatsBar; HMR dev mode
- **4 hooks updated** — Cleanup, EvaluateSession, UpdateContext, resolveProject now write to SQLite
- **New hooks** — `NotifyLtmServer` (broadcasts WS refresh after hook writes)
- **New skills** — `LtmServer`, `CodingStandards`, expanded `ContinuousLearning`
- **New commands** — `/check-context`, `/init-context`, `/update-context`, `/ltm-server`, `/learn`, `/recall`, `/forget`, `/relate`

---

## 2026-03-04 — Fix context-mode executor hang on bun test

### Fixes
- **context-mode executor**: `killTree()` now kills the entire process group (`process.kill(-pid, "SIGKILL")`) instead of just the shell — prevents bun test worker processes from surviving the timeout and hanging indefinitely
- **context-mode executor**: added `detached: !isWin` to `spawn()` so child processes get their own process group ID, making `-pid` kill effective on macOS/Linux

### Refactor
- **context-mode executor**: removed duplicate `const isWin` — now imports `isWindows as isWin` from `runtime.ts` (single source of truth)
- **context-mode runtime**: exported `isWindows` constant

### Docs
- **`rules/workflow.md`**: added "Maintaining context-mode" section with exact rebuild command (`bunx esbuild ...`) and restart step — required after any source edits to `src/`

---

## 2026-03-03 (latest) — Fix filesystem MCP + context-mode plugin

### Fixes
- **filesystem MCP**: installed `@modelcontextprotocol/server-filesystem` globally (`bun add -g`); switched `settings.json` from `bunx` (re-downloads on every start) to direct binary path — eliminates "filesystem · ✘ failed" on startup

### Features
- **context-mode plugin**: reinstalled as full plugin (MCP + PreToolUse hook + slash commands) via marketplace
- **mgrep plugin**: disabled (unused, aggressive tool-override behavior)

---

## 2026-03-02 — README refactor + docs/ restructure + ASCII header

### Features
- **README refactored** — shrunk from 281-line monolith to ~85-line index; added ASCII banner header replacing placeholder image; replaced flat system flow with 3-column tree diagram showing all 3 layers and their outputs
- **`docs/workflow-daily.md`** (new) — Layer 1: Boris Cherny task loop with full ASCII flow, step-by-step breakdown, all commands/agents/hooks tables
- **`docs/memory-short-term.md`** (new) — Layer 2: context-mode MCP — flow diagram, per-tool guide with examples, Bash vs context-mode decision table, diagnostics
- **`docs/memory-long-term.md`** (new) — Layer 3: session context loop + learning loop (both ASCII diagrams), 4 context files table, context commands, hooks, skills, promote-to-gotchas pattern

### Docs
- All content from old README preserved and distributed to appropriate layer doc
- `docs/AGENT_ARCHITECTURE.md` untouched

---

## 2026-03-01 (latest) — slug→registry migration + hook deduplication

### Fixes
- **EvaluateSession slug migration** (`hooks/EvaluateSession/EvaluateSession.ts`) — replaced local `getProjectSlug()` with `resolveProject()` so EvaluateSession now uses the registry like all other hooks; added `PROJECTS_DIR` import to remove redundant constant; fixed double file-read of `SUMMARY_FILE` (in-memory concat instead of re-read); extracted magic `10` → `SUMMARY_HEADER_LINES` constant
- **Cleanup.ts deduplication** (`hooks/Cleanup/Cleanup.ts`) — replaced local `PROJECTS_DIR` constant with import from `resolveProject.ts`; replaced inline trim logic with `trimToLines()` from `hookUtils.ts`
- **SessionAutoName.ts deduplication** (`hooks/SessionAutoName/SessionAutoName.ts`) — replaced local `readStdin()` function with shared `hookUtils.readStdin`

### Docs
- **`rules/session-context.md`** — replaced all `<slug>` path references with `<name>` (registry-based); updated example to show friendly name lookup
- **`CLAUDE.md`** — updated Context System section from `<slug>` to `<name>` with pointer to `/register-project`

### Context migration
- Merged stale context entries from old slug dir (`-Users-rohirikman--claude/`) into `claude-config/` — context `.md` files deleted; `.jsonl` transcripts kept

### Learned patterns saved
- `hook-shared-lib-checklist.md` — always check hookUtils + resolveProject before writing local utilities
- `append-then-trim-in-memory.md` — avoid double file reads after appendFileSync by computing updated content in memory

---

## 2026-03-01

### Features
- **README inspiration credits** — added attribution links to danielmiessler/Personal_AI_Infrastructure and affaan-m/everything-claude-code

### Fixes
- **PreToolUse Write hook** (`settings.json`) — added `context-*.md` exemption so context persistence files are never blocked
- **PreCompact error handling** (`hooks/PreCompact/PreCompact.ts`) — wrapped `main()` in try/catch to handle disk/permission errors gracefully
- **Auditor true parallelism** (`auditor/index.ts`) — replaced `spawnSync` (blocked event loop) with `Bun.spawn` + async timeout race so Flash and Pro run concurrently

---

## 2026-02-26 (latest)

### Fixes
- **Filesystem MCP allow list** — added `/Users/rohirikman/.claude/projects` so context system can read/write project files via MCP tools

---

## 2026-02-26

### Features
- **Registry-based project context system** — `projects/registry.json` maps absolute paths to friendly names; hooks resolve via exact match → longest-prefix match → slug fallback
- **`resolveProject.ts` shared lib** — single source of truth used by `SessionStart`, `PreCompact`, `UpdateContext`
- **`hookUtils.ts` shared lib** — extracted `readStdin`, `parseHookInput`, `readFileSafe`, `trimToLines`, `appendLine` from all hooks
- **`/register-project` command** — manually register or rename a path→name mapping
- **Auto-registration** — new unknown projects register automatically using the folder name; user can rename with `/register-project`
- **Prefix matching** — subdirectories of a registered project inherit the parent's context (e.g. `project/docs` → same context as `project`)
- **CHANGELOG.md** — full changelog generated from all commits since Feb 23

### Commands
- **`/check-context`** — verify Claude has correct context at session start; reads files + cross-checks vs injected context; detects stale summaries
- **`/update-context`** — auto-extracts progress, decisions, gotchas from current session and writes to context files; no prompts
- **`/register-project`** — register or rename a project with conflict detection and migration offer

### Migrations
- Context files migrated from slug folder (`-Users-rohirikman--claude/`) → `claude-config/`

### Chores
- Cleaned up stale entries from `registry.json` after test run
- Updated README: commands table, context system section, directory structure

---

## 2026-02-25

### Docs
- **Add comprehensive agent architecture documentation** — detailed breakdown of all available agents, their roles, and orchestration patterns
- **Add system header image** to assets and README (`claude-code-header.png`)

### Chores
- Rename header image through iterations → final name `claude-config-header.png`
- Trim header image dimensions
- Update plugin timestamps; add image-cache to `.gitignore`
- Update plugins and add assets; archive old structure

---

## 2026-02-24

### Features
- **Auditor: Option C audit modes** — `core`, `full`, and `targeted` audit modes with parallel subsystems (`18c1bb6`)
- **Auditor: Read-only multi-model auditor via Gemini CLI** — runs security/quality audits in isolation using Gemini models (`8548e70`)
- **ContentWriter skill** — blog, LinkedIn, and X/Twitter workflows with `Voice.md` and real examples (`6c77cf3`)
- **Boris Cherny workflow** — `/plan → shift+tab → refine → auto-accept → implement → /simplify → /verify → /commit-push-pr` with token optimization (`d6683cc`)
- **New agents and hooks** — added `SkillGuard`, `SessionAutoName`, `docker-patterns` skill; enriched `BackendDesign` and `verify` skills (`c496b8e`)

### Fixes
- **Auditor: use `--prompt` arg** instead of stdin — fixes silent truncation of large audits (`67da4d5`)
- **Auditor: increase timeouts and expand context** to 900k tokens; detect and report timeouts explicitly (`b0585fb`)
- **Auditor: upgrade to Gemini 3 models** (`gemini-3-flash-preview`, `gemini-3-pro-preview`) and fix auth isolation — keep `HOME` so OAuth credentials work (`7254514`)
- **Auditor: correct Gemini CLI model IDs** with `-preview` suffix (`8fcb9a6`)
- **Hooks: deduplicate UpdateContext entries** by `session_id` to prevent duplicate append bug (`c327334`)
- **Rules: fix 3 audit findings** — slug derivation, workflow conflict, attribution (`5c871c4`)
- **Rules: resolve 4 audit findings** in `package-manager`, `agents`, `learned-summary`, `session-context` (`5279234`)
- **Auditor: move reports** from `~/.claude/audits/` → `~/.claude/auditor/reports/` (`6f1b7c4`)
- **Remove stale `hooks/hooks.json`** referencing backup paths, not used by Claude Code (`e0b1eba`)

### Docs
- **Rewrite README** with full workflow diagram, current structure, all commands/agents/hooks (`eb3691f`)
- **Add auditor README** with full flow, philosophy, isolation model, permissions (`7d39a6b`)

### Chores
- Remove unused skills; backup `Audit` + `CreateCLI` to `~/claude-archive` (`73f8244`)
- Remove pre-push Zed review hook (`ad511d6`)
- Remove low-value rules to reduce session token load (`ddf974f`)
- Move posts output folder from skill dir → `~/Documents/Posts/`; update all skill references (`ac33d96`)

---

## 2026-02-23

### Features
- **Rebuild session context persistence system** — 4 context files per project (`context-goals`, `context-decisions`, `context-progress`, `context-gotchas`); PreCompact assembles `context-summary.md`; SessionStart injects at next session (`1d3e52d`)

### Fixes
- **Fix slug consistency** — replace both `/` and `.` with `-` to match Claude Code's own slug format (`bacdaf0`)
- **Fix EvaluateSession bugs** — rebuilt Stop hook, removed no-op timer, fixed redundant dynamic imports, fixed SkillGuard stdin leak (`bacdaf0`)
