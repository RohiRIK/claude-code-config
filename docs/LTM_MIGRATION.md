# LTM Migration: Standalone → Plugin

> Migration spec for `RohiRIK/claude-ltm-plugin`.
> Canonical source: **[RohiRIK/claude-ltm-plugin](https://github.com/RohiRIK/claude-ltm-plugin)**
>
> *Last updated: 2026-04-16*

---

## Status

The LTM system moved from a standalone install at `~/.claude/memory/` to a Claude Code **plugin** (`ltm@ltm`) managed by the marketplace system. The plugin is installed and working, but **migration is incomplete** — several cleanup and safety steps were never automated.

This document catalogs every gap found during a config hardening audit (2026-04-16) so they can be addressed in the plugin repo as proper features.

---

## What Was Done (manually, 2026-04-16)

| Step | Detail |
|------|--------|
| Duplicate MCP removed | `claude mcp remove ltm` — removed standalone server at `~/.claude/memory/mcp-server.ts`. Only `plugin:ltm:ltm` remains. |
| DB merge | Ran `scripts/merge-ltm-dbs.ts` to merge 5 unique memories + 2 context items from `memory/ltm.db` → `plugins/data/ltm-ltm/ltm.db`. 505 duplicates skipped. |
| Ghost hook dirs deleted | Removed `hooks/{EvaluateSession,PreCompact,SessionStart,NotifyLtmServer,UpdateContext}/` — plugin runs its own copies from `plugins/cache/ltm/ltm/<version>/hooks/src/`. |
| Empty hook entries cleaned | Removed 4 `hooks: []` entries from `settings.json` (2× Stop, SessionStart, PreCompact) left over from the migration. |
| config.json pointer | `ltm.dbPath` already set to `~/.claude/plugins/data/ltm-ltm/ltm.db` — correct. |

---

## What Was NOT Done (gaps for the plugin repo)

### 1. Automatic Duplicate MCP Detection

**Problem:** After plugin install, the old standalone `ltm` MCP server (registered via `claude mcp add`) stays active alongside `plugin:ltm:ltm`. Both expose identical tool names (`ltm_recall`, `ltm_learn`, etc.). Claude Code routes calls randomly between them, splitting writes across two databases.

**Impact:** Memory loss — some learns go to the old DB, some to the new. Users don't notice until they can't recall something they stored.

**Proposed fix:** The plugin's `SessionStart` hook (or a dedicated `PostInstall` hook) should:
1. Run `claude mcp list` and parse for a non-plugin `ltm` entry
2. If found, warn the user and offer to run `claude mcp remove ltm`
3. Or: auto-remove it and log the action

**Acceptance criteria:**
- [ ] After fresh plugin install, only one LTM MCP server is active
- [ ] If a standalone `ltm` MCP exists, user is warned on first session

---

### 2. Automatic DB Migration on Plugin Install

**Problem:** `paths.ts` has auto-migrate logic (`copyFileSync` from `memory/ltm.db` to plugin data dir) but it only fires when `CLAUDE_PLUGIN_DATA` is set AND the target doesn't exist yet. If the target already exists (e.g., from a previous install), the old DB's unique data is silently abandoned.

**Impact:** Users who had the standalone install first, then installed the plugin, may have memories in the old DB that never made it to the plugin DB.

**Current behavior:**
- `paths.ts:32` — copies old → new only if new doesn't exist
- No merge logic, no diff detection, no warning

**Proposed fix:** Add a one-time merge step to the install/upgrade flow:
1. Check if `~/.claude/memory/ltm.db` exists and differs from plugin DB
2. Run a merge (dedup on `dedup_key` + content fallback) — see `scripts/merge-ltm-dbs.ts` for reference implementation
3. Log results: "Merged N unique memories from legacy DB"
4. Set a flag in the `settings` table so it doesn't re-run

**Acceptance criteria:**
- [ ] First plugin start after install merges legacy DB if it exists
- [ ] Merge is idempotent (re-running is safe)
- [ ] Merge stats are logged to stderr
- [ ] A `_migration_legacy_merge` key in the `settings` table prevents re-runs

---

### 3. Embedding Backfill for Merged Memories

**Problem:** Memories merged from the old DB via `merge-ltm-dbs.ts` skip the `embedding` BLOB column (embeddings are provider-specific and tied to the generating model). After merge, 11 memories in the plugin DB have `embedding IS NULL` — they won't appear in semantic recall fallback.

**Current state (plugin DB):**
- 564 memories with embeddings
- 70 memories without embeddings (11 from merge, rest from before embedding was enabled)

**Proposed fix:** The existing `janitor/embeddings.ts` backfill job should:
1. Run on session start or on a cron
2. Query `SELECT id, content FROM memories WHERE embedding IS NULL AND status = 'active'`
3. Embed each and update the row

If this already exists, it may not be running reliably. Verify.

**Acceptance criteria:**
- [ ] All active memories have embeddings within 24h of creation
- [ ] `ltm:health` reports embedding coverage percentage
- [ ] After DB merge, backfill runs automatically on next session

---

### 4. Ghost Hook Cleanup on Plugin Install

**Problem:** When the plugin installs, it registers hooks via `hooks/hooks.json` (SessionStart, PreCompact, EvaluateSession, UpdateContext). But if the user had previously manually created hook directories at `~/.claude/hooks/{SessionStart,PreCompact,EvaluateSession}/`, those remain as ghost directories. They don't run (not wired in `settings.json`), but they confuse audits and take up space.

Similarly, `settings.json` may contain empty `hooks: []` entries for these hook points — leftovers from when the hooks were manually wired.

**Proposed fix:** Add a post-install or first-run check:
1. List known hook names the plugin manages: `SessionStart`, `PreCompact`, `EvaluateSession`, `UpdateContext`
2. For each, check if `~/.claude/hooks/<name>/` exists
3. If it contains only a README or is empty, delete it
4. If it contains `.ts` files, warn the user (they may have custom logic)
5. Check `settings.json` for empty hook entries for these names and offer to clean them

**Acceptance criteria:**
- [ ] After plugin install, no ghost directories for plugin-managed hooks
- [ ] settings.json has no empty hook entries for plugin-managed hook points
- [ ] User is warned (not auto-deleted) if ghost dirs contain custom `.ts` files

---

### 5. Standalone `memory/` Directory Cleanup

**Problem:** After migration, `~/.claude/memory/` still contains the full standalone LTM codebase:
- `mcp-server.ts`, `server.ts`, `db.ts`, `context.ts`, `config.ts`, `embeddings.ts`, `graph.ts`, etc.
- `ltm.db` + WAL files (6.2MB — now stale)
- `graph-ui/` — standalone graph viewer
- `janitor/` — maintenance pipeline
- `migrations/` — schema migrations
- `node_modules/` — dependencies

This is ~30MB+ of dead code that's no longer used. The plugin has its own copies of all these files.

**Proposed fix:** After confirming the DB merge is complete:
1. Archive `memory/ltm.db` to a dated backup: `memory/ltm.db.archived-YYYY-MM-DD`
2. Delete all `.ts` source files, `node_modules/`, `graph-ui/`, `janitor/`, `migrations/`
3. Or: move the entire `memory/` dir to `memory.archived/` with a README explaining why

**Not automated because:** This is destructive and user-specific. The plugin installer should offer it, not force it.

**Acceptance criteria:**
- [ ] Plugin offers cleanup of `~/.claude/memory/` after successful migration
- [ ] User must explicitly confirm before deletion
- [ ] Old DB is backed up before any cleanup
- [ ] `config.json` `ltm.dbPath` is verified to NOT point to the old path before cleanup

---

### 6. `config.json` `ltm.dbPath` Deprecation

**Problem:** The plugin resolves DB path via a priority chain in `paths.ts`:
1. `LTM_DB_PATH` env var
2. `CLAUDE_PLUGIN_DATA/ltm.db` (plugin install)
3. `config.json` `ltm.dbPath` (manual override)
4. `~/.claude/memory/ltm.db` (legacy fallback)

Currently `config.json` has `ltm.dbPath: "~/.claude/plugins/data/ltm-ltm/ltm.db"` — which is redundant with priority 2 (the plugin system sets `CLAUDE_PLUGIN_DATA` automatically). This means:
- If the plugin moves its data dir, `config.json` will point to a stale path
- Users may think they need to maintain this value manually

**Proposed fix:**
1. When `CLAUDE_PLUGIN_DATA` is set and `config.json` `ltm.dbPath` resolves to the same location, log a deprecation notice: "ltm.dbPath in config.json is redundant with plugin data dir — consider removing it"
2. Eventually remove `config.json` path resolution (priority 3) in a major version

**Acceptance criteria:**
- [ ] Deprecation warning logged when config.json path == plugin data path
- [ ] Docs updated to show `CLAUDE_PLUGIN_DATA` as the canonical resolution

---

### 7. `settings.json` `mcpServers` Block Ignored

**Problem:** `settings.json` supported an `mcpServers` key that some users configured for the standalone LTM server. The CLI ignores this key — MCP servers are registered via `claude mcp add` (stored in `.claude.json`). Users may not realize their `mcpServers` config is dead.

**Status:** Removed from this user's config during the hardening audit. But the plugin's docs/README should warn about this.

**Proposed fix:** Add a note to the plugin README:
> MCP servers in `settings.json` `mcpServers` are ignored by Claude Code CLI. The plugin registers its MCP server automatically. If you previously configured `mcpServers.ltm` in settings.json, remove it.

**Acceptance criteria:**
- [ ] Plugin README documents that `settings.json` `mcpServers` is not used
- [ ] `ltm:doctor` checks for and warns about stale `mcpServers` entries

---

## Reference Implementation

A working merge script is at `~/.claude/scripts/merge-ltm-dbs.ts`. It:
- Deduplicates memories on `dedup_key` (UNIQUE) with content+category+project fallback
- Remaps tag IDs, memory_tag links, and relations to new IDs
- Merges context_items on (project_name, type, content)
- Skips embedding blobs (need provider-specific regeneration)
- Runs in a single transaction for atomicity

Results from 2026-04-16 run:
```
Memories inserted:    5
Memories skipped:     505 (already in plugin DB)
Tags mapped:          9
Memory_tags linked:   700
Relations merged:     428
Context items added:  2
```

---

## Ownership

| Component | Owner |
|-----------|-------|
| Migration automation (gaps 1–7) | `RohiRIK/claude-ltm-plugin` |
| Manual cleanup already done | `RohiRIK/claude-code-config` (this repo) |
| Merge script reference | `~/.claude/scripts/merge-ltm-dbs.ts` |
| Plugin DB (authoritative) | `~/.claude/plugins/data/ltm-ltm/ltm.db` |
| Old DB (stale, kept for safety) | `~/.claude/memory/ltm.db` |
