---
description: "Observe codebase state, pull LTM context, and prepare for planning."
argument-hint: "[--quick|--deep|--focused <path>]"
---

# Observe Command

Runs a **deterministic codebase observation** — no LLM, pure data gathering via git, SQLite, and the filesystem. Produces a structured report injected into your session context.

## Usage

| Invocation | Level | When to use |
|-----------|-------|-------------|
| `/observe` | deep (default) | Manual deep scan before complex work |
| `/observe --quick` | quick | Fast context refresh mid-session |
| `/observe --deep` | deep | Full scan: git + LTM + context + tree + deps |
| `/observe --focused src/auth` | focused | Scoped scan on a specific directory |

## What Each Level Gathers

| Data | quick | deep | focused |
|------|:-----:|:----:|:-------:|
| Git status (branch + uncommitted) | ✓ | ✓ | ✓ |
| LTM recalls (globals + project) | ✓ | ✓ | ✓ |
| Project context items (goal/decisions/gotchas) | ✓ | ✓ | ✓ |
| Recent commits (last 10) | | ✓ | ✓ |
| File tree (depth 3, max 50 entries) | | ✓ | ✓ (scoped) |
| Package.json dependency counts | | ✓ | |
| Risk flags | ✓ | ✓ | ✓ |

## Auto-Triggers

- **Session start** — quick observation runs automatically via `SessionStart` hook
- **Before `/plan`** — deep observation auto-runs via `PrePlan` hook if none exists in the current session

## How It Works

```bash
bun ~/.claude/hooks/Observe/Observe.ts --deep --cwd $(pwd)
```

The script:
1. Resolves the project name from the registry
2. Gathers git state, file tree, and dependencies (synchronous `execSync` calls)
3. Pulls LTM recalls from `~/.claude/memory/ltm.db` via `getContextMerge`
4. Pulls project context items (goal, decisions, gotchas, progress) via `getItems`
5. Formats a structured markdown report
6. Persists a compact summary to LTM (`category=observation`, `importance=2`)
7. Writes session flag to `~/.claude/tmp/observation-done.txt`
8. Outputs the full report to stdout (injected into session context)

## Example Output

```markdown
## 🔭 Observation Report [deep]

**Project**: my-app
**CWD**: `/home/user/projects/my-app`
**Time**: 2025-01-15T10:30:00.000Z

### Git Status
- Branch: `feature/auth`
- Uncommitted files: 3
```
M src/auth/login.ts
M src/auth/session.ts
? src/auth/tokens.ts
```

### Recent Commits
```
a1b2c3d feat: add JWT refresh logic
e4f5g6h fix: session expiry edge case
...
```

### File Tree
```
./src
./src/auth
./src/auth/login.ts
./src/auth/session.ts
...
```

### Dependencies
- Package: `my-app`
- Production: 12
- Dev: 8

### LTM Recalls
- [global] Always use httpOnly cookies for JWT tokens
- [project] Auth module uses Zod for input validation

### Project Context
- [goal] Implement passwordless login flow
- [decision] Use Supabase Auth as the provider
- [gotcha] Token refresh must happen server-side only

### Risk Flags
- ⚠️  3 uncommitted file(s)
```

## Integration Notes

- **Persistence**: compact summary stored in LTM as `category=observation` for future recall
- **Session flag**: `~/.claude/tmp/observation-done.txt` prevents duplicate observations; expires after **4 hours**
- **Non-blocking**: errors in observation never fail the parent hook or command
- **No LLM**: entirely deterministic — git, SQLite reads, and `find` commands only
