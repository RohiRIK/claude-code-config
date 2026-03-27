# PrePlan Hook

**File:** `hooks/PrePlan/PrePlan.ts`

**Trigger:** UserPromptSubmit

**Purpose:** Lean Observe System — inject a topic-scoped deep briefing before `/plan` begins

---

## Overview

PrePlan fires on every user prompt but acts only when the prompt starts with `/plan`. It gathers git state, relevant LTM memories, and target file snippets for the plan topic, then injects them as `additionalContext` before Claude enters plan mode.

No external API calls are made. Claude interprets the gathered data in-session.

---

## Lean Observe System — Option B Split

The system is split into two non-overlapping responsibilities:

| Hook | Trigger | Scope | What it provides |
|------|---------|-------|-----------------|
| `SessionStart` | Session open | Broad | Uncommitted file count + diff summary (quick git state) |
| `PrePlan` | `/plan` prompt | Topic-scoped | Git diff, recent commits, LTM recalls, file snippets |

**No overlap:** PrePlan does NOT repeat git status or LTM globals — those are already in context from SessionStart. PrePlan adds depth for the specific planning topic only.

---

## Logic Flow

```
UserPromptSubmit fires
        │
        ▼
prompt starts with /plan?
        │ no → return (no-op)
        │ yes
        ▼
extractTopic(prompt) → strip "/plan " prefix
        │
        ▼
resolveProject(cwd) → project name
        │
        ▼
buildDeepBriefing(cwd, project, topic)
        │
        ├── git diff --stat HEAD      (uncommitted changes summary)
        ├── git log --oneline -5      (recent commits)
        ├── getLtmRecallsForTopic()   (topic-word match against LTM globals + scoped)
        └── extractFilePaths(topic)   (file paths mentioned in topic → first 50 lines)
        │
        ▼
stdout → Claude Code injects as additionalContext
```

---

## Shared Library

`hooks/lib/observe-briefing.ts` exports:

- `buildQuickBriefing(cwd)` — used by SessionStart; returns one-line git summary or empty string
- `buildDeepBriefing(cwd, project, topic)` — used by PrePlan; returns `### Pre-Plan Context` markdown block

---

## Output Format

When data is found, the hook writes this to stdout:

```markdown
### Pre-Plan Context

> Before planning **"<topic>"**, consider the following codebase state.
> Flag risks, relevant past decisions, and conflicts in your plan.

**Uncommitted changes:**
```
<git diff --stat>
```

**Recent commits:**
```
<git log --oneline -5>
```

**Relevant LTM memories:**
- [global] …
- [project] …

**Target file** `path/to/file.ts`:
```
<first 50 lines>
```
```

If no data is found (clean repo, no relevant LTM, no file paths in topic), the hook writes nothing — no noise.

---

## LTM Recall Strategy

`getLtmRecallsForTopic()` filters memories by keyword overlap with the topic:

1. Extract words > 3 chars from topic
2. Check each word against `globals` (up to 5) and `scoped` memories (up to 10)
3. If no matches: fall back to top 3 scoped memories
4. Return up to 20 results

Uses `getContextMerge(project)` from `~/.claude/memory/db.js` (LTM plugin shared lib).

---

## Non-Fatal Errors

Hook failures are caught and logged to `hooks.log` — they never block the `/plan` command. If `buildDeepBriefing` throws (e.g., DB unavailable), Claude continues to plan mode without the briefing.

---

## Files

- **Source:** `hooks/PrePlan/PrePlan.ts`
- **Shared library:** `hooks/lib/observe-briefing.ts`
- **Logger:** `hooks/lib/hookLogger.ts`

## Related

- [SessionStart](session-start.md) — broad quick briefing (Option B partner)
- [Hooks Overview](overview.md) — full hook inventory

---

*Added for Lean Observe System (PR #6) — Last updated: 2026-03-27*
