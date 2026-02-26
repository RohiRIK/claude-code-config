# /check-context — Verify Session Context

Run at the start of any session to confirm Claude has the right context loaded.

## Instructions for Claude

1. Resolve the current project:
   - Read `~/.claude/projects/registry.json`
   - Match `cwd` via exact → prefix → slug fallback
   - Determine `projectDir` = `~/.claude/projects/<name>/`

2. Read all context files that exist in `projectDir`:
   - `context-goals.md`
   - `context-decisions.md`
   - `context-progress.md`
   - `context-gotchas.md`
   - `context-summary.md` (if present)

3. Cross-check what you read from files against what was injected at session start.

4. Respond with this exact structure:

---

## Context Check — **<name>**

**Path:** `<cwd>`
**Registry match:** <exact | prefix from `<path>` | slug fallback | not registered>

### Loaded from files:
- **Goal:** <first line of context-goals.md, or `none`>
- **Last 3 progress items:**
  - <item>
  - <item>
  - <item>
- **Decisions on file:** <count>
- **Gotchas on file:** <count>

### Session injection:
<one of:>
- Context was injected at session start — matches files ✅
- Context was injected but differs from files ⚠️ (files may be newer)
- No injection — fresh session or context-summary.md missing

### Status:
<one of:>
- **Complete** — context loaded and consistent. Ready to work.
- **Partial** — some files missing. Run `/init-context` to create missing files.
- **Stale** — files exist but context-summary.md is older than 7 days. Run `/compact` to rebuild.
- **Empty** — no context files found. Run `/init-context` to set up tracking.

---

## Rules

- Read the actual files — do not rely on memory alone
- Never fabricate content not found in the files
- If files and injected context differ, flag it clearly
- If `registry.json` does not exist or project is unregistered, say so and suggest `/register-project`
