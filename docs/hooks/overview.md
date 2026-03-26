# Hooks Overview

> Lifecycle-triggered scripts that run at specific Claude Code events.

---

## Session Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SESSION START                              │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │   SessionStart   │ ───▶ Regenerates summary from ltm.db        │
│  └──────────────────┘         then injects into Claude's prompt │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DURING SESSION                              │
│                                                                  │
│  Hooks manage context in ltm.db automatically:                 │
│  • goal        (current objective — one row per project)       │
│  • decision    (architectural decisions — permanent)           │
│  • progress    (session log — trimmed to last 20)              │
│  • gotcha      (warnings/blockers — permanent)                 │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │  SuggestCompact     │     │    SkillGuard       │           │
│  │ (every ~50 tools)   │     │  (skill invocation) │           │
│  └─────────────────────┘     └─────────────────────┘           │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │  SessionAutoName    │     │   UpdateContext     │           │
│  │  (first prompt)     │     │   (session end)     │           │
│  └─────────────────────┘     └─────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRE-COMPACT                                │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │    PreCompact    │ ───▶ Reads ltm.db → writes                │
│  └──────────────────│         context-summary.md (fallback)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SESSION END                                │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │ EvaluateSession    │     │     Cleanup         │           │
│  │ - Save patterns    │     │ - Trim progress     │           │
│  │ - Extract errors   │     │ - Delete stale dirs │           │
│  │ - Tool usage       │     │                     │           │
│  └─────────────────────┘     └─────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Hook Types

### PreToolUse Hooks
Trigger before a tool is used.

| Hook | Trigger | Action | Blocking? |
|------|---------|--------|-----------|
| `tmux reminder` | bun run dev | Block dev servers | Yes |
| `git push` | git push | Open Zed + confirm | Yes |
| `Write` guard | .md/.txt (non-standard) | Block creation | Yes |

### PostToolUse Hooks
Trigger after a tool is used.

| Hook | Trigger | Action |
|------|---------|--------|
| `Prettier` | Edit .ts/.tsx/.js/.jsx | Format code |
| `tsc check` | Edit .ts/.tsx | Type check |
| `console.log` | Any edit | Warn debug logs |

### Lifecycle Hooks
Trigger at session events.

| Hook | When | Purpose |
|------|------|---------|
| `SessionStart` | Session begins | Inject context |
| `PreCompact` | Before compaction | Assemble summary |
| `EvaluateSession` | Session ends | Extract patterns |
| `Cleanup` | Session ends | Trim data |

## Context Storage

**Primary:** SQLite DB managed by the LTM plugin — see [RohiRIK/claude-ltm-plugin](https://github.com/RohiRIK/claude-ltm-plugin) for the DB path and internals. The hooks in this repo interact with it via the LTM MCP server.

| Table | Purpose | Managed by |
|-------|---------|-----------|
| `context_items` | Per-project goals/decisions/progress/gotchas | Hooks (automatic) |
| `memories` | Global learned insights with FTS5 + graph relations | `/learn`, `/recall`, `/forget`, `/relate` |

**Generated fallback:** `~/.claude/projects/<name>/context-summary.md` — written by PreCompact and SessionStart, read if DB unavailable.

| context_items type | Purpose | TTL |
|--------------------|---------|-----|
| `goal` | Current objective | Replaced on change |
| `decision` | Architectural choices | Permanent |
| `progress` | Session log | Trimmed to last 20 |
| `gotcha` | Warnings / blockers | Permanent |

## Project Name Resolution

Registry at `~/.claude/projects/registry.json` maps paths → friendly names.

```
1. Exact match:  /Users/roh/projects/myapp → "my-app"
2. Prefix match: /Users/roh/projects/myapp/docs → "my-app" (inherits)
3. Slug fallback: /Users/roh/projects/myapp → -Users-roh-projects-myapp
```

Use `/register-project` to add entries. Use `/check-context` to verify.

## Detailed Documentation

- [SessionStart](hooks/session-start.md) - Context injection
- [PreCompact](hooks/pre-compact.md) - Summary assembly
- [EvaluateSession](hooks/evaluate-session.md) - Pattern extraction
- [Cleanup](hooks/cleanup.md) - Data trimming
- [SuggestCompact](hooks/suggest-compact.md) - Compaction suggestions
- [SessionAutoName](hooks/session-auto-name.md) - Tab naming
- [SkillGuard](hooks/skill-guard.md) - False trigger prevention
- [UpdateContext](hooks/update-context.md) - Progress updates

---

*Documentation derived from `hooks/README.md` - Last updated: 2026-03-26*
