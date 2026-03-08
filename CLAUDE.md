# ~/.claude — Global Claude Code Config

## What This Is
Global config for Claude Code. Applies to ALL projects. Rules enforce style, security, testing, and workflow.

## Workflow (Boris Cherny pattern)
```
/plan → (shift+tab: Plan Mode) → refine → auto-accept → implement → /simplify → /verify → /commit-push-pr
```

## Key Commands
| Command | When |
|---------|------|
| `/plan` | Before any non-trivial change |
| `/simplify` | After implementation |
| `/verify` | Before committing (runs tsc + tests + build) |
| `/commit-push-pr` | Final step — precomputes git context |
| `/tdd` | New features — write tests first |
| `/code-review` | After writing code |
| `/init-context` | New project — seeds goal into SQLite LTM |
| `/learn` | Store a pattern or insight in LTM |
| `/recall` | Search long-term memory before starting work |

## Agents (invoke via Task tool)
planner · architect · tdd-guide · code-reviewer · security-reviewer · build-error-resolver · e2e-runner · refactor-cleaner · doc-updater

## Non-Negotiables
- **bun** not npm/yarn · **uv** not pip · **zed** for editor
- Immutability: spread operators, never mutate
- No hardcoded secrets — env vars only
- 80% test coverage minimum
- Conventional commits: `feat|fix|refactor|docs|chore: description`
- No `console.log` in committed code
- Long-running commands → tmux

## Context System
SQLite LTM at `~/.claude/memory/ltm.db`. Per-project context (goals/decisions/progress/gotchas) + global memories.
Registry at `~/.claude/projects/registry.json` — use `/register-project` to see your project name.
Hooks manage context automatically — PreCompact → `context-summary.md` → SessionStart injects at next session.

## Active Hooks
- **SessionStart**: injects project context (60 lines max)
- **PreCompact**: saves context before compaction
- **EvaluateSession**: extracts patterns at session end
- **SuggestCompact**: suggests /compact at 50 tool calls
- **PostToolUse**: Prettier + tsc on every edit, warns on console.log
- **PreToolUse**: blocks dev servers outside tmux, opens Zed before git push

## Rules (full detail in rules/)
coding-style · git-workflow · testing · security · performance · agents · hooks · session-context · patterns · package-manager
