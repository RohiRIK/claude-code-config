# ~/.claude — Global Claude Code Config

Global config applying to ALL projects. Rules in `rules/` have full detail.

## Working Agreement

**Plan.** Enter plan mode for anything non-trivial — 3+ steps, or an architectural decision. Write the spec precisely enough that ambiguity is gone before code is. If the work goes sideways, stop and re-plan rather than pushing through. Plan verification too, not just building.

**Delegate.** Use subagents freely to keep the main context clean — research, exploration, parallel analysis. One task per subagent, with its own success criterion. On a hard problem, spend more compute: fan out.

**Verify.** A task is done when it is proven to work, not when the code is written. Run the tests, read the logs, diff behavior against main where that's meaningful. The bar: *would a staff engineer approve this?*

**Refine.** On non-trivial changes, pause once and ask whether a more elegant solution exists. If a fix feels hacky, replace it with the one you'd have written knowing what you know now. Simple, obvious fixes ship as-is — this is a quality gate, not an invitation to over-engineer.

**Fix autonomously.** Given a bug report, a failing test, or a red CI run: go fix it. Point yourself at the logs and resolve them. Ask only when the intent is genuinely ambiguous.

**Improve.** After a correction from the user, write the pattern to `tasks/lessons.md` as a rule that prevents the same mistake, and record it in LTM (`mcp__plugin_openltm_memory__learn`, `category=gotcha`). Review `tasks/lessons.md` at session start. Iterate on these until the mistake rate drops.

### Core Principles
- **Simplicity first** — the smallest change that fully solves it.
- **Root causes** — no temporary patches, no papering over. Senior-engineer standards.
- **Minimal blast radius** — touch only what the task requires.

### Task Loop
1. Write the plan to `tasks/todo.md` as checkable items.
2. Confirm the plan before implementing.
3. Check items off as they land.
4. Summarize each step at a high level.
5. Add a review section to `tasks/todo.md` when done.
6. Capture corrections in `tasks/lessons.md`.

## Commands
| Command | When |
|---------|------|
| `/plan` | Before any non-trivial change |
| `/capture` | After implement — save context + learn |
| `/simplify` | After implementation |
| `/verify` | Before committing |
| `/commit-push-pr` | Final step |
| `/openltm:memory learn` | Store pattern/insight in LTM |
| `/openltm:memory recall` | Before starting work on a topic |
| `/openltm:health` | Memory health check |
| `/openltm:doctor` | Diagnose hook/plugin errors |
| `/fast` | Toggle fast mode (Opus, faster output) |

Which workflow to run, and when to reach for `ctx_execute` over Bash: load the **WorkflowGuide** skill.
Committing in this repo (`~/.claude`): load the **PreCommitSanitize** skill first.
Writing prompts, rule files, skills, or agent instructions: load the **Prompting** skill first.

## Non-Negotiables
- **bun** not npm · **uv** not pip · **zed** for editor
- Spread operators, never mutate · No hardcoded secrets · No `console.log`
- 80% test coverage · Conventional commits · Long-running commands → tmux

## LTM MCP Auto-Use

The `openltm` MCP server is always available. Use it proactively, without waiting for `/recall` or `/learn`:

- **Before a non-trivial task**: `mcp__plugin_openltm_memory__recall` with the topic as `query`
- **On discovering a non-obvious pattern or gotcha**: `mcp__plugin_openltm_memory__learn`
- **On an architectural decision**: `mcp__plugin_openltm_memory__learn` with `category=architecture`

`recall` uses FTS5 + semantic fallback — use natural language, not keywords.
Good: `"how we handle async errors in hooks"` · Weak: `"async errors"`

Skip for trivial requests. The goal is automatic knowledge retrieval, not a recall before every sentence.

## Context System
SQLite LTM at `~/.claude/plugins/data/OpenLtm-openltm/openltm.db`. Hooks auto-manage context.
Registry: `~/.claude/projects/registry.json` — auto-registered by LTM plugin hooks.

## Secrets & .gitignore
`.env` is gitignored. `.env.schema` (committed) defines expected vars with varlock decorators.
Pre-commit hook runs `bunx varlock scan --staged` to block leaked secrets.
To validate: `bunx varlock load` · To add a new secret: add to `.env.schema` with `@sensitive` decorator, then set value in `.env`.

**Gitignored (never commit):** `.env`, `*.db`, `memory/`, `plans/`, `specs/`, `projects/`, `sessions/`, `contexts/`, `tasks/`, `telemetry/`, `statsig/`, `transcripts/`, `tmp/`, `shell-snapshots/`, `file-history/`, `plugins/data/`, `plugins/marketplaces/`, `security_warnings_state_*`, `cache/`, `logs/`, `history.jsonl`.
If a new runtime directory appears, add it to `.gitignore` before committing anything else.
