# ~/.claude — Global Claude Code Config

Global config applying to ALL projects. Rules in `rules/` have full detail.

## Workflow
`/plan → implement → /capture → /simplify → /verify → /commit-push-pr`

## Commands
| Command | When |
|---------|------|
| `/plan` | Before any non-trivial change |
| `/capture` | After implement — save context + learn |
| `/simplify` | After implementation |
| `/verify` | Before committing |
| `/commit-push-pr` | Final step |
| `/init-context` | New project |
| `/learn` | Store pattern/insight in LTM |
| `/recall` | Before starting work on a topic |
| `/decay-report` | Memory health check |
| `/hook-doctor` | Diagnose hook errors |

## Agents
planner · architect · tdd-guide · code-reviewer · security-reviewer · build-error-resolver · e2e-runner · refactor-cleaner · doc-updater

## Non-Negotiables
- **bun** not npm · **uv** not pip · **zed** for editor
- Spread operators, never mutate · No hardcoded secrets · No `console.log`
- 80% test coverage · Conventional commits · Long-running commands → tmux

## Context System
SQLite LTM at `~/.claude/memory/ltm.db`. Hooks auto-manage context.
Registry: `~/.claude/projects/registry.json` — `/register-project` to onboard.

## LTM MCP Auto-Use

The `ltm` MCP server is always available. Use it proactively — do NOT wait for `/recall` or `/learn`:

- **Before any non-trivial task**: call `mcp__ltm__ltm_recall` with the topic as `query`
- **After discovering a non-obvious pattern or gotcha**: call `mcp__ltm__ltm_learn`
- **When making an architectural decision**: call `mcp__ltm__ltm_learn` with `category=architecture`

`recall` uses **FTS5 + semantic fallback** — use natural language queries, not just keywords.
Good: `"how we handle async errors in hooks"` · Bad: `"async errors"`

Skip for trivial/one-liner requests. Use judgment — the goal is automatic knowledge retrieval,
not calling recall before every sentence.

## Hooks
SessionStart · PreCompact · EvaluateSession · Cleanup · SuggestCompact · PostToolUse · PreToolUse

## Context-Mode MCP
Sandbox execution to prevent context bloat. Use `ctx_execute`/`ctx_batch_execute` instead of Bash for any command with >20 lines output. `/context-mode:ctx-stats` · `/context-mode:ctx-doctor` · `/context-mode:ctx-upgrade`

## Rules
coding-style · git-workflow · testing · security · performance · agents · hooks · session-context · patterns · package-manager
