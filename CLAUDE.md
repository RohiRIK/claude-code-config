# ~/.claude — Global Claude Code Config

Global config applying to ALL projects. Rules in `rules/` have full detail.

## Workflow

**Bug fix:** `/test` → `/simplify` → `/capture` → `/commit-push-pr`

**Small feature:** `/plan` → `/build` → `/simplify` → `/capture` → `/commit-push-pr`

**Non-trivial feature:** `/spec` → `/plan` → `/dev` → `/simplify` → `/capture` → `/verify` → `/commit-push-pr`

Full decision guide: `rules/workflow-guide.md`

## Commands
| Command | When |
|---------|------|
| `/plan` | Before any non-trivial change |
| `/capture` | After implement — save context + learn |
| `/simplify` | After implementation |
| `/verify` | Before committing |
| `/commit-push-pr` | Final step |
| `/ltm:memory learn` | Store pattern/insight in LTM |
| `/ltm:memory recall` | Before starting work on a topic |
| `/ltm:health` | Memory health check |
| `/ltm:doctor` | Diagnose hook/plugin errors |

## Agents
planner · architect · tdd-guide · code-reviewer · security-reviewer · build-error-resolver · e2e-runner · refactor-cleaner · doc-updater

## Non-Negotiables
- **bun** not npm · **uv** not pip · **zed** for editor
- Spread operators, never mutate · No hardcoded secrets · No `console.log`
- 80% test coverage · Conventional commits · Long-running commands → tmux

## Context System
SQLite LTM at `~/.claude/plugins/data/ltm-ltm/ltm.db`. Hooks auto-manage context.
Registry: `~/.claude/projects/registry.json` — auto-registered by LTM plugin hooks.

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
**settings.json:** SkillGuard · SuggestCompact · SessionAutoName · PrePlan · PostEditCheck · Cleanup
**LTM plugin:** SessionStart · PreCompact · EvaluateSession · UpdateContext (managed via plugin hooks.json)

## Context-Mode MCP
Sandbox execution to prevent context bloat. Use `ctx_execute`/`ctx_batch_execute` instead of Bash for any command with >20 lines output. `/context-mode:ctx-stats` · `/context-mode:ctx-doctor` · `/context-mode:ctx-upgrade`

## Secrets & .gitignore
`.env` is gitignored. `.env.schema` (committed) defines expected vars with varlock decorators.
Pre-commit hook runs `bunx varlock scan --staged` to block leaked secrets.
To validate: `bunx varlock load` · To add a new secret: add to `.env.schema` with `@sensitive` decorator, then set value in `.env`.

**Gitignored (never commit):** `.env`, `*.db`, `memory/`, `plans/`, `specs/`, `projects/`, `sessions/`, `contexts/`, `tasks/`, `telemetry/`, `statsig/`, `transcripts/`, `tmp/`, `shell-snapshots/`, `file-history/`, `plugins/data/`, `plugins/marketplaces/`, `security_warnings_state_*`, `cache/`, `logs/`, `history.jsonl`.
If a new runtime directory appears, add it to `.gitignore` before committing anything else.

## Rules
coding-style · git-workflow · workflow-guide · testing · security · agents · session-context · patterns · package-manager
