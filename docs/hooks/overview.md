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
| `SkillGuard` | Skill tool invocation | Validate skill calls | Yes |
| `tmux reminder` | bun run dev | Block dev servers | Yes |
| `build tools` | bun install/test, cargo, etc. | Suggest tmux | No |
| `Write` guard | .md/.txt (non-standard) | Block creation | Yes |
| `SuggestCompact` | Edit or Write | Suggest /compact at 50 tool calls | No |

### UserPromptSubmit Hooks
Trigger on every user prompt before Claude responds.

| Hook | Trigger | Action |
|------|---------|--------|
| `SessionAutoName` | First prompt | Sets Ghostty tab title |
| `PrePlan` | `/plan` prompt | Injects Pre-Plan Context briefing |

### PostToolUse Hooks
Trigger after a tool is used.

| Hook | Trigger | Action |
|------|---------|--------|
| `Biome` | Edit .ts/.tsx/.js/.jsx | Auto-format with `bunx biome check --write` |
| `tsc check` | Edit .ts/.tsx | Run `tsc --noEmit` filtered to edited file |
| `console.log` | Edit .ts/.tsx/.js/.jsx | Warn about debug logs |
| `PR creation` | Bash `gh pr create` | Log PR URL + Actions status hint |
| `Goose` | Bash SpawnAgent.ts | Trigger agent summarization |

### Stop Hooks
Trigger when Claude's response ends (session end / stop signal).

| Hook | Action |
|------|--------|
| `console.log check` | Scan git-modified files for stray `console.log` |
| `Cleanup` | Run `decayMemories()`, trim stale data |
| `UpdateContext` | Write session progress entry to ltm.db (LTM plugin) |
| `EvaluateSession` | Extract patterns/progress at session end (LTM plugin) |

### Lifecycle Hooks
Trigger at session events.

| Hook | When | Purpose |
|------|------|---------|
| `SessionStart` | Session begins | Inject LTM context + quick git briefing |
| `PreCompact` | Before compaction | Assemble context-summary.md fallback |

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
1. Exact match:  ~/projects/myapp → "my-app"
2. Prefix match: ~/projects/myapp/docs → "my-app" (inherits)
3. Slug fallback: ~/projects/myapp → -Users-you-projects-myapp
```

Use `/register-project` to add entries. Use `/check-context` to verify.

## Lean Observe System

Two-part briefing system that gives Claude codebase awareness without API calls:

| Part | Hook | What it provides |
|------|------|-----------------|
| Quick briefing | `SessionStart` | Uncommitted file count + diff summary at session open |
| Deep briefing | `PrePlan` | Topic-scoped git diff, recent commits, LTM recalls, file snippets — injected on `/plan` |

No overlap: PrePlan does not repeat what SessionStart already injected. Claude interprets both in-session — no external LLM call.

## Detailed Documentation

- [SessionStart](hooks/session-start.md) - LTM context injection + quick git briefing
- [PrePlan](hooks/pre-plan.md) - Lean Observe deep briefing for /plan
- [PreCompact](hooks/pre-compact.md) - Summary assembly
- [EvaluateSession](hooks/evaluate-session.md) - Pattern extraction
- [Cleanup](hooks/cleanup.md) - Data trimming
- [SuggestCompact](hooks/suggest-compact.md) - Compaction suggestions
- [SessionAutoName](hooks/session-auto-name.md) - Tab naming
- [SkillGuard](hooks/skill-guard.md) - False trigger prevention
- [UpdateContext](hooks/update-context.md) - Progress updates (runs via LTM plugin)

---

*Last updated: 2026-03-27*
