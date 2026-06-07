---
name: agy
description: "Delegate a coding, refactor, PR-review, or image-generation task to the Antigravity CLI (agy) as an autonomous worker, then monitor and report results."
disable-model-invocation: true
argument-hint: [task description]
---

# Agy

Delegate work to the [Antigravity CLI](https://antigravity.google) (`agy`,
Google's Gemini-powered terminal agent) and orchestrate it from this session via
`Bash`. Its standout feature is **image generation** via Nano Banana — see
`Workflows/GenerateImage.md`.

This skill is **manual-only** (`disable-model-invocation: true`): it runs when you
type `/agy <task>`, never on its own. To let Claude auto-delegate later, remove that
frontmatter line and rewrite the description as `"... USE WHEN ..."`.

Task to delegate: **$ARGUMENTS**

## How delegation maps to Claude Code tools

Agy runs as a subprocess. Orchestrate it with native tools:

| Need | Tool |
|------|------|
| Bounded one-shot task (waits for result) | `Bash` (foreground) |
| Long / multi-file task | `Bash` with `run_in_background: true` |
| Watch a backgrounded run | `BashOutput` (poll) or `Monitor` (block until done) |
| Working directory | `agy … --add-dir <path>` (adds dir to the workspace; repeatable) |

Agy print mode has a built-in cap (`--print-timeout`, default 5m). Still wrap runs
in an outer `timeout` (see `Reference.md` → Timeouts) as a hard backstop.

## Workflow Routing

Read `$ARGUMENTS`, classify intent, load the matching workflow.

| Intent | Trigger words | File |
|--------|---------------|------|
| Generate / edit an image | "image", "picture", "render", "logo", "mockup", "generate an image" | `Workflows/GenerateImage.md` |
| Implement / refactor / fix | "add", "build", "refactor", "fix", "implement" | `Workflows/Delegate.md` |
| Review a PR or diff | "review PR", "review pr #", "review diff" | `Workflows/ReviewPR.md` |

## Quick Reference

- Flags, models, install, auth, image setup, troubleshooting: read `Reference.md`.
- Preflight `agy --version` and confirm auth before the first run.
- Default to **print mode** `agy -p '<prompt>'` (non-interactive, prints, exits).
  Never start the bare TUI (`agy` with no `-p`) — it is interactive and will hang
  this session.
