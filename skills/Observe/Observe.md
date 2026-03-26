# Observe Skill

## Purpose

Systematic codebase reconnaissance before planning or implementation. Ensures every non-trivial task starts from an informed baseline — knowing what exists, what LTM remembers, and where the risks are — rather than planning blind.

## When to Activate

- **Beginning of non-trivial tasks** — any work spanning multiple files or components
- **Before `/plan`** — automatically triggered via `PrePlan` hook if no observation exists
- **Switching codebase areas** — moving from backend to frontend, or entering an unfamiliar module
- **After pulling remote changes** — observe what changed before planning next steps
- **After session compaction** — context was compressed; re-observe to rebuild awareness
- **When plan reveals gaps** — unexpected complexity discovered mid-implementation

## Observation Checklist

### Quick Level (session start)
- [ ] Current branch and uncommitted file count
- [ ] LTM recalls: global memories + project-scoped memories
- [ ] Project context: active goal, key decisions, open gotchas, last progress note
- [ ] Risk flags: uncommitted changes, LTM gotchas present

### Deep Level (before /plan, manual)
- [ ] Everything in quick level
- [ ] Recent 10 commits (what changed recently)
- [ ] File tree up to depth 3, ignoring node_modules/dist/.git (max 50 entries)
- [ ] Dependency counts (production + dev) from package.json
- [ ] Risk flags: uncommitted changes, missing tests, conflicting decisions

### Focused Level (scoped to a path)
- [ ] Everything in quick level
- [ ] Recent 10 commits
- [ ] File tree scoped to the focus path
- [ ] Risk flags relevant to the focus area

## How to Interpret Observations

### 🔴 Red Flags — Investigate Before Proceeding

| Flag | Meaning | Action |
|------|---------|--------|
| Uncommitted changes in target area | Previous session left work unfinished | Review and commit or stash first |
| LTM gotchas for this project | Known pitfalls exist | Read gotchas before touching related code |
| No tests found for module | High risk of silent regressions | Add tests before changing |
| Stale LTM entries (old decisions) | Architecture may have drifted | Verify decisions are still valid |
| Conflicting decisions in context | Inconsistent direction | Clarify before planning |

### 🟢 Green Lights — Proceed with Confidence

- Branch is clean (0 uncommitted files) — safe to start
- LTM recalls match the task topic — prior knowledge available
- Recent commits show active work in this area — patterns are fresh
- Goal context aligns with current request — scope is clear
- No conflicting decisions in context items

## Technical Implementation

- **Script**: `~/.claude/hooks/Observe/Observe.ts`
- **Nature**: fully deterministic — no LLM calls, no API requests
- **Data sources**: `git` (via `execSync`), `SQLite` (via `~/.claude/memory/db.js` and `context.js`), `find` (file tree), `package.json` (dependencies)
- **Output format**: structured markdown with `## 🔭 Observation Report [level]` header
- **Persistence**: compact summary stored in LTM (`category=observation`, `importance=2`, `tags=["auto-observation"]`)
- **Session flag**: `~/.claude/tmp/observation-done.txt` — prevents duplicate runs; expires after 4 hours (hard system expiry; the separate "< 30 min" skip threshold in `rules/observe-before-plan.md` is a soft guideline for manual re-observation, not the flag TTL)
- **Auto-triggers**:
  - `SessionStart` hook runs `--quick` at every session start
  - `PrePlan` hook (`UserPromptSubmit`) runs `--deep` before `/plan` if flag is absent or expired

## Invoking Manually

```bash
# Default deep observe
/observe

# Quick refresh
/observe --quick

# Scoped to a specific directory
/observe --focused src/payments
```

Or directly via CLI:
```bash
bun ~/.claude/hooks/Observe/Observe.ts --deep --cwd $(pwd)
bun ~/.claude/hooks/Observe/Observe.ts --focused src/auth --cwd $(pwd)
```
