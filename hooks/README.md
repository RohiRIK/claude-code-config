# Claude Code Hooks System

Per-project context persistence and session management for Claude Code.

---

## Full Session Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SESSION START                                              │
│                                                             │
│  SessionStart.ts                                            │
│  ├─ reads cwd from hook input                               │
│  ├─ derives project slug (cwd with / → -)                   │
│  ├─ looks for ~/.claude/projects/<slug>/context-summary.md  │
│  ├─ if found + fresh → outputs JSON to stdout               │
│  └─ Claude sees "Restored Project Context" and continues    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  DURING SESSION (Claude maintains)                          │
│                                                             │
│  After each task, Claude writes to:                         │
│  ├─ context-goals.md      current goal (1-3 lines)          │
│  ├─ context-decisions.md  append decisions made             │
│  ├─ context-progress.md   append ✓ completed items          │
│  └─ context-gotchas.md    append ⚠ warnings/blockers        │
│                                                             │
│  When context window grows large, Claude flushes all 4      │
│  files proactively before continuing heavy work             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  PRE-COMPACTION (automatic)                                 │
│                                                             │
│  PreCompact.ts                                              │
│  ├─ reads cwd from hook input                               │
│  ├─ reads all 4 context files                               │
│  ├─ assembles context-summary.md (max 60 lines)             │
│  ├─ stamps compaction checkpoint + timestamp                │
│  └─ Claude Code compacts — summary preserved                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  SESSION END (Stop hooks, in order)                         │
│                                                             │
│  1. console.log audit   → warns about debug logs            │
│  2. EvaluateSession.ts  → logs errors/tools/files to        │
│                           skills/Learned/patterns/          │
│  3. Cleanup.ts          → trims context-progress.md         │
│                           deletes stale project dirs (14d)  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  NEXT SESSION START (same project)                          │
│                                                             │
│  SessionStart reads context-summary.md                      │
│  Claude: "Restored context: working on X, Y is done..."     │
└─────────────────────────────────────────────────────────────┘
```

---

## Hook Reference

### PreToolUse Hooks

| Trigger | Action | Blocking? |
|---------|--------|-----------|
| `npm/pnpm/yarn/bun run dev` | Block — must use tmux | Yes |
| `install/test/cargo/docker/pytest/vitest/playwright` | Suggest tmux | No |
| `git push` | Open Zed + prompt to confirm | Yes |
| `Write` to `.md/.txt` (non-standard names) | Block creation | Yes |
| Any `Edit` or `Write` | StrategicCompact suggestion | No |

### PostToolUse Hooks

| Trigger | Action |
|---------|--------|
| `Bash` with `gh pr create` | Log PR URL + review command |
| `Edit` on `.ts/.tsx/.js/.jsx` | Run `prettier --write` |
| `Edit` on `.ts/.tsx` | Run `bunx tsc --noEmit` (errors for edited file only) |
| `Edit` on `.ts/.tsx/.js/.jsx` | Warn if `console.log` found |
| `Bash` with `SpawnAgent.ts` | Trigger Goose CheckAndSummarize after 5s |

### PreCompact Hook

| File | `PreCompact.ts` |
|------|----------------|
| Trigger | Before Claude Code compacts context |
| Input | `cwd` (working directory) |
| Action | Reads 4 context files → writes `context-summary.md` |
| Output | stderr only (no injection) |

### SessionStart Hook

| File | `SessionStart.ts` |
|------|------------------|
| Trigger | Session begins |
| Input | `cwd` (working directory) |
| Action | Reads `context-summary.md` for project → injects to Claude |
| Output | JSON to stdout: `{ "context": "..." }` |
| Cap | 60 lines max, 30 day staleness limit |

### Stop Hooks (in order)

| Hook | Action |
|------|--------|
| console.log audit | Scans modified git files for `console.log` |
| `EvaluateSession.ts` | Extracts session analytics to `Learned/patterns/` |
| `Cleanup.ts` | Trims progress, deletes stale project dirs |

---

## Per-Project Context Files

Location: `~/.claude/projects/<slug>/`

Slug derivation: replace all path separators with `-`
- `/Users/roh/projects/myapp` → `-Users-roh-projects-myapp`

| File | Purpose | TTL | Managed by |
|------|---------|-----|-----------|
| `context-summary.md` | Injected on SessionStart | Rebuilt each compaction | PreCompact hook |
| `context-goals.md` | Current goal (1-3 lines) | Until goal changes | Claude |
| `context-decisions.md` | Architectural decisions log | Forever | Claude |
| `context-progress.md` | Completed + in-progress tasks | Trimmed to last 20 items | Claude + Cleanup |
| `context-gotchas.md` | Warnings and blockers | Forever | Claude |

---

## Analytics / Passive Logging

Location: `~/.claude/skills/Learned/patterns/YYYY-MM-DD.md`

Written by `EvaluateSession.ts` at session end.
Contains: errors encountered, tools used (with counts), files modified.
**Never injected into Claude's context** — reference only.

---

## File Structure

```
~/.claude/hooks/
  PreCompact/
    PreCompact.ts      ← assembles context-summary.md per project
  SessionStart/
    SessionStart.ts    ← injects context-summary.md to Claude
  EvaluateSession/
    EvaluateSession.ts ← passive analytics logger
  Cleanup/
    Cleanup.ts         ← trims progress, deletes stale dirs
  README.md            ← this file

~/.claude/rules/
  session-context.md   ← instructs Claude to maintain context files
  hooks.md             ← hook overview
  (other rules...)

~/.claude/projects/
  -Users-roh-projects-myapp/
    context-summary.md
    context-goals.md
    context-decisions.md
    context-progress.md
    context-gotchas.md

~/.claude/skills/Learned/patterns/
  2026-02-23.md
  2026-02-22.md
  (...)
```

---

## Troubleshooting

**SessionStart not injecting context**
- Check that `cwd` is present in hook input: add `console.error(JSON.stringify(input))` temporarily
- Verify `context-summary.md` exists and is less than 30 days old
- Confirm `process.stdout.write(JSON.stringify(output))` runs without error

**PreCompact not finding cwd**
- The `cwd` field name may vary by Claude Code version
- PreCompact tries: `input.cwd`, `input.working_directory`, `input.session?.cwd`
- Add stderr logging to see raw input

**Slug mismatch (SessionStart finds no file)**
- Log slug on both hooks: `console.error("[SessionStart] slug:", slug)`
- Compare with actual directory names in `~/.claude/projects/`
- Path separator on macOS is `/` so slug starts with `-Users-`

**context-summary.md is empty**
- Claude hasn't updated the 4 context files yet this session
- Trigger a `/compact` after Claude has written to at least one context file

**Cleanup deleting active project**
- Cleanup uses file mtimes — if you haven't used a project in 14 days, it deletes
- Increase `STALE_DAYS` in `Cleanup.ts` if needed
