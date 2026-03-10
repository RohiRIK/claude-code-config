# Changelog

## [2026-03-10] Phase 2.1: Multi-Provider Expansion + Settings UI Redesign

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

## [2026-03-09] Phase 2: LTM Evolution — Janitor Agent

- **Janitor sub-agent** with 4 pipeline stages: decay, promote, dedup, supersedes
- **Memory decay**: unused memories lose confidence over time, auto-archive at threshold
- **Auto-promote**: decisions/gotchas auto-elevate to global memories
- **Semantic dedup**: embedding vectors + cosine similarity + LLM merge
- **Supersedes relations**: merged memories mark originals as superseded
- **Pluggable providers**: Gemini, OpenRouter, Ollama (embedding + LLM)
- **Settings UI** (`/settings`): provider config, decay tuning, dedup threshold
- **Pending UI** (`/pending`): review/approve/reject janitor suggestions
- **Schema migration**: shared-db.ts runs idempotent ALTERs before schema.sql
- **Shared DB singleton**: prevents dual WAL connections across all modules
- 20 files changed, +2720/-95 lines

---

## [2026-03-09] LTM Graph UX Overhaul

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

### Sidebar (ProjectList.tsx)
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

## [2026-03-08] SQLite LTM + Graph Visualizer v1

- Native Bun SQLite LTM: `schema.sql`, `db.ts`, `context.ts`, `dedup.ts`, `migrate.ts`
- 4 hooks updated: Cleanup, EvaluateSession, UpdateContext, resolveProject
- Graph UI server: `memory/server.ts` (API :7331) + Next.js 15 app (`:7332`)
- D3 force graph with Sidebar, FilterBar, ProjectList, StatsBar
- Tag filter panel (TagFilterBar + dimmedIds)
- ⌘K spotlight search (SpotlightModal with ref-based keyboard handler)
- Project drill-down page (`/project/[name]` with MiniGraph radial layout)
- FTS5 search, WebSocket live refresh, persistent SQLite singleton
