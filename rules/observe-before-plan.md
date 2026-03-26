---
description: Observe the codebase before planning
alwaysApply: true
---

# Observe-Before-Plan

## Principle: Never Plan Blind

Every non-trivial plan must be grounded in the current codebase state. Planning without observing leads to:
- Missing existing patterns that should be reused
- Overlooking uncommitted work from a prior session
- Ignoring LTM gotchas that have caused bugs before
- Proposing architectures that conflict with past decisions

## How It Works

The observe system runs automatically at three points:

| Trigger | Level | Hook |
|---------|-------|------|
| Session start | `--quick` | `SessionStart` |
| Before `/plan` (if none exists) | `--deep` | `PrePlan` (UserPromptSubmit) |
| Manual `/observe` | configurable | CLI |

### What "Observed" Means

An observation is considered **complete** when:
1. `~/.claude/tmp/observation-done.txt` exists AND
2. Its timestamp is less than 4 hours old AND
3. A `## 🔭 Observation Report` section is present in the session context

If any condition is false, the `PrePlan` hook will auto-run a deep observation before `/plan` proceeds.

## When to Skip

Observation may be skipped when:
- The change is **trivial** — one-liners, typo fixes, isolated config tweaks
- The user **explicitly requests** skipping (`/plan --no-observe` or "skip observation")
- A **recent observation exists** (< 30 minutes old) and the task is in the same area

When in doubt, observe. The script is fast (< 2 seconds for quick, < 5 seconds for deep).

## When to Re-Observe

Re-run observation (use `/observe --deep` or `/observe --focused <path>`) when:

- **Switching codebase areas** — moving from one module/service to another
- **After pulling remote changes** — `git pull` may have changed relevant files
- **After session compaction** — context was compressed; re-observe to rebuild awareness
- **When plan reveals unexpected complexity** — observation data is stale relative to the problem
- **After a long pause** (> 4 hours) — the session flag expires; auto-re-observation fires

## Integration with `/plan`

When the planner agent receives a request:

1. **Check for observation** — look for `## 🔭 Observation Report` in session context
2. **If present**: use its data for Memory Insights, reference git state and file structure in the plan, note any risk flags as plan risks
3. **If absent**: the `PrePlan` hook should have already run it; if not, run `bun ~/.claude/hooks/Observe/Observe.ts --deep --cwd $(pwd)` and wait for the report before proceeding

### Memory Insights from Observation

In the `## Memory Insights` section of the plan, combine:
- LTM recalls from the observation report
- Graph reasoning results from the LTM API
- Any risk flags from the observation

This gives the plan a full picture: past learnings + current codebase state.
