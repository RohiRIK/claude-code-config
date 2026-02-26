# Hooks Overview

> Lifecycle-triggered scripts that run at specific Claude Code events.

---

## Session Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SESSION START                              │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │   SessionStart   │ ───▶ Injects context-summary.md            │
│  └──────────────────┘         into Claude's prompt              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DURING SESSION                              │
│                                                                  │
│  Claude maintains context files:                                │
│  • context-goals.md      (current goal)                        │
│  • context-decisions.md  (architectural decisions)              │
│  • context-progress.md   (completed tasks)                     │
│  • context-gotchas.md    (warnings/blockers)                   │
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
│  │    PreCompact    │ ───▶ Assembles 4 context files            │
│  └──────────────────│         into context-summary.md           │
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

## Context Files

Location: `~/.claude/projects/<name>/` (friendly name from `registry.json`)

| File | Purpose | TTL | Managed by |
|------|---------|-----|-----------|
| `context-summary.md` | Injected at start | Rebuilt on compact | PreCompact |
| `context-goals.md` | Current goal | Until changed | Claude |
| `context-decisions.md` | Decisions log | Permanent | Claude |
| `context-progress.md` | Completed tasks | Trimmed to 20 | Claude+Cleanup |
| `context-gotchas.md` | Warnings | Permanent | Claude |

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

*Documentation derived from `hooks/README.md` - Last updated: 2026-02-25*
