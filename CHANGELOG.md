# Changelog

All notable changes to this global Claude Code configuration.

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
