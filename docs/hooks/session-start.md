# SessionStart Hook

**File:** `hooks/src/SessionStart.ts` in [RohiRIK/claude-ltm-plugin](https://github.com/RohiRIK/claude-ltm-plugin)

**Trigger:** Session begins

**Purpose:** Inject project LTM context + quick git state into Claude's prompt

---

## Overview

The SessionStart hook fires when a new Claude Code session opens. It reads the project's LTM context from `ltm.db` and injects it as `additionalContext`, giving Claude immediate awareness of the project goal, past decisions, recent progress, and known gotchas — without waiting for `/recall`.

It also runs `buildQuickBriefing()` from the Lean Observe System to inject a one-line uncommitted change summary when dirty files are present.

---

## Logic Flow

```
1. Read stdin (JSON with cwd, session_id)
2. resolveProject(cwd) → registry.json → project name
3. Read ltm.db via LTM plugin helpers:
   - getContextMerge(project):
       globals   (importance≥4, status=active, sorted by decayScore DESC)
       scoped    (importance≥3, status=active, LIMIT 15, sorted by decayScore DESC)
       updateLastUsed() called on all returned IDs
   - getItems(project, 'goal')
   - getItems(project, 'decision')
   - getItems(project, 'progress', 3)   ← last 3 entries
   - getItems(project, 'gotcha')
4. buildQuickBriefing(cwd):
   - git status --porcelain
   - git diff --stat HEAD
   - Returns one-line summary or "" if clean
5. stdout → Claude Code injects as additionalContext
```

---

## Role in the Lean Observe System

SessionStart is the **quick briefing** half of the Lean Observe System (Option B split):

| Part | Hook | Scope | Data |
|------|------|-------|------|
| Quick briefing | **SessionStart** | Broad | LTM context + uncommitted file count + diff summary |
| Deep briefing | PrePlan | Topic-scoped | Git diff, recent commits, LTM recalls, file snippets |

SessionStart runs once at session open — fast, no LLM call. PrePlan fires on every `/plan` prompt and adds depth for the specific planning topic.

---

## Output Format

```
## Restored Project Context

**Goal:** <goal>

**Decisions:** …

**Progress (last 3):** …

**Gotchas:** …

**LTM Globals:** …

---
*Context restored from previous session.*

**Uncommitted:** 5 file(s) — 3 insertions(+), 1 deletion(-)
```

---

## Input

```json
{
  "cwd": "/Users/roh/projects/myapp",
  "session": {
    "session_id": "abc123"
  }
}
```

## Project Resolution

Uses `resolveProject(cwd)` from `hooks/lib/resolveProject.ts` (shared lib in this repo):

```
1. Exact match in registry.json  → use registered name
2. Longest prefix match          → inherit parent project name
3. Slug fallback                 → cwd with / and . replaced by -
```

Registry: `~/.claude/projects/registry.json` → `{ "/abs/path": "friendly-name" }`

---

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| MAX_INJECT_LINES | 60 | Max lines to inject |
| LTM_DB_PATH | `$CLAUDE_PLUGIN_DATA/ltm.db` | Resolved by plugin |

---

## Related

- [PrePlan](pre-plan.md) — deep briefing partner (Lean Observe System)
- [PreCompact](pre-compact.md) — writes context-summary.md fallback before compaction
- [Hooks Overview](overview.md) — full hook inventory

---

*Updated for Lean Observe System + LTM plugin migration — Last updated: 2026-03-27*
