---
name: WorkflowGuide
description: Pick the right workflow path (Layer 1 daily vs Layer 2 spec-driven), and know when to use /build vs /dev vs /test and when to reach for context-mode over Bash. USE WHEN choosing a workflow for a task, or maintaining the context-mode MCP server.
---

# Workflow Guide

Quick reference for picking the right path. Full detail: `docs/workflow-daily.md` · `docs/workflow-dev.md`

## Which path?

**Do you know exactly what to build?** → Layer 2 (`/spec`)
**Figuring it out or moving fast?** → Layer 1 (`/plan`)

| Situation | Layer |
|-----------|-------|
| Trivial one-liner | Just implement — no commands needed |
| Bug fix | Layer 1: `/test` (ProveIt) → `/simplify` → `/capture` → `/verify` → `/commit-push-pr` |
| Small feature (clear scope) | Layer 1: `/plan` → `/build` → `/simplify` → `/capture` → `/verify` → `/commit-push-pr` |
| Non-trivial feature | Layer 2: `/spec` → `/plan` → `/dev` → `/test` → `/simplify` → `/capture` → `/verify` → `/commit-push-pr` |

---

## Layer 1 — Daily Workflow

Entry: `/plan`. You have a task and want to move.

```
[observe auto-fires] → /plan → IMPLEMENT (auto-accept: Shift+Tab×2) → /capture → /simplify → /verify → /commit-push-pr
```

- `[observe]` is automatic — PrePlan hook fires when `/plan` is typed, injecting git state + topic-scoped LTM recalls
- After `/plan` confirms → switch to **auto-accept mode** (Shift+Tab×2) for implementation
- `/test` replaces the whole chain for bug fixes (ProveIt: write failing test → fix → pass)

---

## Layer 2 — Dev Workflow

Entry: `/spec` (or `/test` for bugs). You know what to build and want it spec-driven.

```
/spec → /plan → /build (or /dev) → /test → /simplify → /capture → /verify → /commit-push-pr
```

- `/spec` — recalls LTM + explores codebase → writes grounded spec with testable criteria
- `/plan` — each task maps to one acceptance criterion from the spec
- `/build` = task-by-task manual control · `/dev` = full automation
- `/test` — final regression sweep across all changed files

---

## Every Path Ends The Same Way

| Step | Command | What it does |
|------|---------|-------------|
| Remove complexity | `/simplify` | code-simplifier agent — flattens nesting, removes abstraction |
| Lock in context | `/capture` | saves progress + fires `/learn` in one shot |
| Gate before ship | `/verify` | tsc → lint → tests → build → security → diff |
| Ship | `/commit-push-pr` | conventional commit → push → PR |

> `/verify` is optional on small changes but mandatory before non-trivial PRs.

---

## /build vs /dev vs /test

| Command | When |
|---------|------|
| `/build` | Manual control — review between each task |
| `/dev` | Full automation — all tasks in one go |
| `/test` | No plan — standalone bug fix or isolated feature |

---

## Context-Safe Execution (context-mode MCP)

Use the sandbox tools instead of Bash whenever raw output isn't needed directly:

- `ctx_execute` — tests, builds, type-checks, linters, log/error dumps, any command with >~1 KB output
- `ctx_batch_execute` — multiple independent commands in one call
- `ctx_execute_file` — process a file without reading raw text into context
- `ctx_fetch_and_index` + `ctx_search` — large documentation pages (prefer over WebFetch >~5 KB)

Bash stays right for short diagnostics (`git status`, `ls`), commands whose raw output IS the answer, and interactive/TTY work.

Diagnostics: `/context-mode:ctx-stats` · `/context-mode:ctx-doctor`

### Maintaining context-mode

The MCP server runs from a pre-built bundle (`server.bundle.mjs`), NOT from source.
After editing any file in `~/.claude/plugins/marketplaces/context-mode/src/`:

```bash
cd ~/.claude/plugins/marketplaces/context-mode
bunx esbuild src/server.ts --bundle --platform=node --target=node18 --format=esm \
  --outfile=server.bundle.mjs \
  --external:better-sqlite3 --external:turndown --external:turndown-plugin-gfm \
  --external:@mixmark-io/domino --external:zod --external:@modelcontextprotocol/sdk \
  --minify
pkill -f "server.bundle.mjs"   # Claude Code auto-restarts it on next tool use
```
