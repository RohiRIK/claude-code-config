# LTM Recall — Historical Reference

> ⚠️ **MOVED** — The LTM recall implementation now lives in **[RohiRIK/OpenLtm](https://github.com/RohiRIK/OpenLtm)**.
> This document is preserved as historical context. For current recall flow details and FTS5/semantic fallback internals, see the plugin repo.
> For the integration boundary, see [`docs/LTM_MIGRATION.md`](LTM_MIGRATION.md).

---

# LTM Recall — How It Works (Historical)

> Status: FTS5 keyword search + semantic fallback via `getSimilarMemories` (implemented 2026-03-20).

---

## Flow Diagram

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    mcp__ltm__ltm_recall(query)                  │
  └────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
                ┌──────────────────────────┐
                │  Sanitize query for FTS5 │
                │  split → quote → OR-join │
                │  "use" "bun" "npm"       │
                └──────────────┬───────────┘
                               │
                               ▼
                ┌──────────────────────────┐
                │   FTS5 keyword search    │◄── fast, always runs
                │   memories_fts MATCH ?   │
                └──────────────┬───────────┘
                               │
                      results ≥ limit?
                     ┌─────────┴──────────┐
                    YES                   NO
                     │                    │
                     │                    ▼
                     │     ┌──────────────────────────┐
                     │     │  getSimilarMemories()    │◄── semantic fallback
                     │     │  embed query → cosine    │    (gated: ltm.semanticFallback)
                     │     │  similarity vs DB blobs  │
                     │     └──────────────┬───────────┘
                     │                    │
                     └─────────┬──────────┘
                               │ merge + dedupe by ID
                               ▼
                ┌──────────────────────────┐
                │  Filter: category/tags/  │
                │  project scope / status  │
                └──────────────┬───────────┘
                               │
                               ▼
                ┌──────────────────────────┐
                │  enrichMemory() per hit  │
                │  → attach tags           │
                │  → attach relations      │
                │  → strip embedding blob  │
                └──────────────┬───────────┘
                               │
                               ▼
                ┌──────────────────────────┐
                │   Return MemoryWithRela- │
                │   tions[] to Claude      │
                └──────────────────────────┘
```

---

## How `mcp__ltm__ltm_recall` works today

When Claude calls `mcp__ltm__ltm_recall(query)`, here is the exact sequence:

### 1. Query sanitization (`db.ts:321`)
The raw query string is split into tokens, each token is double-quoted, and joined with `OR`:
```
"LTM MCP auto use session"
→ "LTM" OR "MCP" OR "auto" OR "use" OR "session"
```
This prevents FTS5 from interpreting reserved words (like `use`, `select`, `not`) as column names or operators.

### 2. FTS5 keyword search (`db.ts:327`)
The sanitized query runs against the `memories_fts` virtual table:
```sql
SELECT rowid FROM memories_fts WHERE memories_fts MATCH ? ORDER BY rank LIMIT 50
```
Returns row IDs of memories whose content/category match any token. Ranked by relevance.

### 3. Optional filters
If the caller also passes `category`, `tags`, or `project`, those filter the FTS5 result set further (intersection logic).

### 4. Enrich results (`db.ts:135`)
For each matched memory ID:
- Fetch full memory row
- Attach tags (from `memory_tags` join)
- Attach relations (from `memory_relations` join, both directions)
- Strip the raw embedding blob (it's ~260KB binary, useless over MCP)

### 5. Return to Claude
Array of `MemoryWithRelations` objects — each with content, category, importance, tags, and linked memories.

---

## Semantic Fallback — How It Works

`getSimilarMemories(text, topN, threshold)` in `embeddings.ts:238`:
- Embeds the query text into a vector using the configured provider
- Computes cosine similarity against all stored embedding blobs in the DB
- Returns top-N memories above a similarity threshold (default 0.5)

**Trigger condition:** FTS5 result set has fewer IDs than the requested `limit`.

**Deduplication:** both FTS5 and semantic results feed into the same `Set<number>` of IDs, so there are no duplicates.

**Config gate:** `ltm.semanticFallback` (boolean, default `true`). Set to `false` in `~/.claude/config.json` to disable.

**Graceful degradation:** wrapped in try/catch — if embedding fails (no API key, network error), FTS5 results are returned unchanged.

**`recall()` is now `async`** — the only caller, `mcp-server.ts`, was already `async` so `await recall()` is a drop-in change.

---

## Key files

| File | Role |
|------|------|
| `memory/db.ts:313` | `recall()` — FTS5 search + semantic fallback + enrich |
| `memory/embeddings.ts:238` | `getSimilarMemories()` — cosine similarity search |
| `memory/embeddings.ts:170` | `embedText()` — embed arbitrary text string |
| `memory/mcp-server.ts:57` | MCP tool handler — `await recall()` |
| `memory/config.ts` | `ltm.semanticFallback` flag (default `true`) |
