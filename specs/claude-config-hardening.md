# Spec: Claude Config Hardening & Cleanup

**Created:** 2026-04-16
**Scope:** `~/.claude` (claude-config project)
**Type:** Security hardening + dead code cleanup + optimization

---

## Context

Critical audit of the `~/.claude` Claude Code setup revealed 7 issues across security, dead config, and efficiency. This spec defines acceptance criteria for each fix.

### LTM Prior Decisions

- Memory #382 (importance 5, confirmed 2x): `mcpServers` in settings.json is ignored by CLI — dead config
- Memory #147 (importance 4): `hooks/UpdateContext/` is untracked in git
- Memory #563 (importance 5): LTM plugin DB migration complete — old hooks migrated to plugin, legacy entries should be cleaned
- Memory #45 (importance 4): Hook shared-lib checklist — any new hook code must use `hookUtils.ts` and `resolveProject.ts`

### Current State

- **No `.gitignore`** — `.env` (contains Google API key), `.DS_Store`, `cache/`, DB files all exposed to accidental commit
- **4 empty hook entries** in settings.json (SessionStart, PreCompact, 2x Stop) — vestigial from LTM plugin migration
- **5 ghost hook directories** with deleted/orphaned code
- **3 PostToolUse hooks** fire independently on every TS edit (biome + tsc + console.log check)
- **Dead `mcpServers`** block in settings.json — CLI ignores it
- **Stale command references** in CLAUDE.md (`/register-project`, `/update-context`)
- **CLAUDE.md duplicates** content already in rules/ files

---

## Acceptance Criteria

### AC-1: .gitignore Creation (CRITICAL — Security)

- [ ] `.gitignore` exists at `~/.claude/.gitignore`
- [ ] Covers at minimum:
  ```
  .env
  .env.*
  .DS_Store
  *.db
  *.db-shm
  *.db-wal
  cache/
  debug/
  logs/
  node_modules/
  bunx-*/
  node-compile-cache/
  paste-cache/
  history.jsonl
  mcp-needs-auth-cache.json
  backups/
  ```
- [ ] Running `git status` after creation shows `.env` and `.DS_Store` no longer in untracked list
- [ ] Existing tracked files are NOT affected (only untracked files are filtered)

### AC-2: Varlock Integration (Security — Future-Proofing)

- [ ] `varlock` installed as project dependency via `bunx varlock init` (not brew)
- [ ] `.env.schema` created at `~/.claude/.env.schema` with schema for `GOOGLE_API_KEY`:
  ```
  # @sensitive @required @type=string(startsWith=AIza)
  GOOGLE_API_KEY=
  ```
- [ ] `varlock load` validates the `.env` against the schema successfully
- [ ] `.env.schema` is committed to git (it contains no secrets — only metadata)
- [ ] `.env` remains gitignored (contains actual values)
- [ ] Add `varlock scan` as a pre-commit check (catches leaked secrets in staged files)
- [ ] Document varlock usage in a brief section in CLAUDE.md or a rule file

### AC-3: Empty Hook Entries Removed (Cleanup)

- [ ] settings.json `Stop` array: remove the 2 entries with `matcher: "*"` and `hooks: []` (lines 137-144)
- [ ] settings.json `SessionStart` array: remove the entry with `matcher: "*"` and `hooks: []` (lines 146-151)
- [ ] settings.json `PreCompact` array: remove the entry with `matcher: "*"` and `hooks: []` (lines 152-157)
- [ ] After removal, settings.json is valid JSON (parse test passes)
- [ ] Claude Code starts without hook errors

### AC-4: Ghost Hook Directories Cleaned (Cleanup)

- [ ] `hooks/EvaluateSession/` — delete (only has README.md, code migrated to LTM plugin)
- [ ] `hooks/PreCompact/` — delete (only has README.md, code migrated to LTM plugin)
- [ ] `hooks/SessionStart/` — delete (only has README.md, code migrated to LTM plugin)
- [ ] `hooks/NotifyLtmServer/` — delete (has .ts file but NOT wired in settings.json — orphaned)
- [ ] `hooks/UpdateContext/` — delete if exists and untracked (LTM gotcha #147)
- [ ] Remaining hook directories all have both: (a) a `.ts` file AND (b) a corresponding entry in settings.json

### AC-5: Dead mcpServers Block Removed (Cleanup)

- [ ] `mcpServers` key removed from settings.json entirely
- [ ] Per LTM memory #382: CLI uses `.claude.json` for MCP servers, not settings.json
- [ ] Validate: `claude mcp list` still shows all expected MCP servers (unaffected by this change)

### AC-6: PostToolUse Hook Consolidation (Optimization)

- [ ] The 3 separate PostToolUse hooks for TS/JS edits (biome, tsc, console.log) consolidated into **one script**
- [ ] New consolidated script: `hooks/PostEditCheck/PostEditCheck.ts`
- [ ] Script runs sequentially: biome check → tsc (scoped to edited file) → console.log grep
- [ ] Uses shared libs per memory #45: `hookUtils.ts` for stdin, etc.
- [ ] Single settings.json entry with matcher `tool == "Edit" && tool_input.file_path matches "\\.(ts|tsx|js|jsx)$"`
- [ ] The duplicate console.log check in the `Stop` hook is removed (PostEditCheck already covers it)
- [ ] Net result: 1 process instead of 3 per TS edit

### AC-7: CLAUDE.md Deduplication & Stale Reference Fix (Optimization)

- [ ] Remove stale commands from CLAUDE.md:
  - `/init-context` → replace with `/ltm:project`
  - `/register-project` reference in Context System section → remove or update
  - `/hook-doctor` → replace with `/ltm:health` or `/ltm:doctor`
  - `/decay-report` → replace with `/ltm:health`
- [ ] Hooks list updated: remove `SessionStart · PreCompact · EvaluateSession` (migrated to plugin), keep only hooks that are actually in settings.json
- [ ] CLAUDE.md stays lean — it should reference rules/ for detail, not duplicate them
- [ ] Rules listing updated: remove `performance` (doesn't exist in `rules/` directory) and `hooks` (doesn't exist)

---

## Out of Scope

- **API key rotation**: user must rotate the Google API key manually in Google Cloud Console — we cannot do this programmatically
- **LTM database cleanup**: audited separately, not part of this config hardening
- **Rules file content changes**: only fixing references, not rewriting rule content
- **New hook features**: only consolidation and cleanup of existing hooks

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Removing mcpServers breaks Claude.app desktop | User primarily uses CLI; if desktop needs it, re-add to Claude.app-specific config |
| Consolidated PostEditCheck slower than parallel hooks | Hooks already run sequentially per matcher — consolidation actually reduces overhead |
| Varlock adds complexity for one .env var | Schema is tiny now but prevents future secret sprawl; `varlock scan` in pre-commit is the real value |
| Deleting hook dirs loses README documentation | READMEs describe migrated behavior — LTM plugin docs are the canonical source now |

---

## Implementation Order

1. **AC-1** (.gitignore) — security first, zero risk
2. **AC-2** (varlock) — depends on AC-1 being done
3. **AC-3** (empty hook entries) — quick JSON edit
4. **AC-4** (ghost directories) — `rm -rf`, low risk
5. **AC-5** (dead mcpServers) — quick JSON edit
6. **AC-6** (PostToolUse consolidation) — new code, needs testing
7. **AC-7** (CLAUDE.md cleanup) — documentation, do last
