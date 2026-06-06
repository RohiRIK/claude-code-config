---
name: opencode
description: "Delegate a coding, refactor, or PR-review task to the OpenCode CLI as an autonomous worker, then monitor and report results."
disable-model-invocation: true
argument-hint: [task description]
---

# OpenCode

Delegate work to the [OpenCode](https://opencode.ai) CLI — a provider-agnostic
autonomous coding agent — and orchestrate it from this session via `Bash`.

This skill is **manual-only** (`disable-model-invocation: true`): it runs when you
type `/opencode <task>`, never on its own. To let Claude auto-delegate later,
remove that frontmatter line and rewrite the description as `"... USE WHEN ..."`.

Task to delegate: **$ARGUMENTS**

## How delegation maps to Claude Code tools

OpenCode runs as a subprocess. Orchestrate it with native tools:

| Need | Tool |
|------|------|
| Bounded one-shot task (waits for result) | `Bash` (foreground) |
| Long / multi-file task | `Bash` with `run_in_background: true` |
| Watch a backgrounded run | `BashOutput` (poll) or `Monitor` (block until done) |
| Working directory | `opencode run … --dir <path>` (preferred over `cd`) |

Always wrap runs in `timeout` (see `Reference.md` → Timeouts) so a stalled run
self-kills instead of hanging the session. Default model when none is given:
`opencode/deepseek-v4-flash-free`.

## Workflow Routing

Read `$ARGUMENTS`, classify intent, load the matching workflow.

| Intent | Trigger words | File |
|--------|---------------|------|
| Implement / refactor / fix | "add", "build", "refactor", "fix", "implement" | `Workflows/Delegate.md` |
| Review a PR or diff | "review PR", "review pr #", "review diff" | `Workflows/ReviewPR.md` |

## Quick Reference

- Flags, models, install, binary pinning, troubleshooting: read `Reference.md`.
- Always preflight `opencode --version` and confirm a provider before the first run.
- Default to `opencode run '<prompt>'` (non-interactive). Never start the bare TUI
  (`opencode` with no subcommand) — it is interactive and will hang this session.
