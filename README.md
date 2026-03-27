# ~/.claude — Claude Code Global Config

> Personal Claude Code setup by [Rohi Rikman](https://github.com/RohiRIK). Applies to all projects.
> Last updated: 2026-03-27
>
> Inspired by [danielmiessler/Personal\_AI\_Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure), [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code),
> and [Google Always-On Memory Agent](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/gemini/agents/always-on-memory-agent).

![Claude Config Header](assets/claude-config-header.png)

---

## Philosophy

This project is three things at once:

**1. A living system for Claude Code**
A continuously improved setup — skills, hooks, commands, and flows — built and refined session by session. Not a one-time config. A system that gets smarter the more I use it.

**2. Giving Claude a real brain**
I wanted Claude to remember. Not just within a session, but across weeks and projects. That meant building a long-term memory layer (SQLite LTM, now [`claude-ltm-plugin`](https://github.com/RohiRIK/claude-ltm-plugin)) and pairing it with a short-term execution memory ([`context-mode`](https://github.com/mksglu/context-mode) — genuinely awesome plugin). Together they give Claude the context awareness a real collaborator would have.

**3. Learning in public**
Everything here — the decisions, the gotchas, the things that broke and got fixed — is visible in the LTM graph and the git history. This repo is my process as much as it is a product. If it helps someone else build something better, even better.

> The LTM is the brain. The hooks are the reflexes. The workflow is the discipline.

---

## 3-Layer Architecture

```
                         ~/.claude
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐
  │   LAYER 1   │   │   LAYER 2   │   │    LAYER 3      │
  │   WORKFLOW  │   │  SHORT-TERM │   │   LONG-TERM     │
  │             │   │   MEMORY    │   │    MEMORY       │
  │ Boris Cherny│   │context-mode │   │ claude-ltm-     │
  │  task loop  │   │   plugin    │   │    plugin       │
  └──────┬──────┘   └──────┬──────┘   └───────┬─────────┘
         │                  │                  │
         ▼                  ▼                  ▼
  /plan → implement   cmd → subprocess   ltm.db (SQLite)
  → /capture          → BM25 index       → PreCompact
  → /simplify         → summaries        → SessionStart
  → /verify           → context          → /learn /recall
  → /commit-push-pr                      → graph UI :7332
         │
         ▼
  ┌─────────────────────────────────────────┐
  │         LEAN OBSERVE SYSTEM             │
  │                                         │
  │  SessionStart ──▶ quick git briefing    │
  │       +                                 │
  │  PrePlan ──▶ /plan topic deep context   │
  │  (git · LTM recalls · file snippets)    │
  │  No API calls — Claude interprets       │
  └─────────────────────────────────────────┘
```

> "A good plan is really important. Claude typically 1-shots implementation from a well-formed plan." — Boris Cherny

---

## Long-Term Memory System

SQLite-backed memory managed by [`claude-ltm-plugin`](https://github.com/RohiRIK/claude-ltm-plugin) — the flagship feature of this config.

**What it stores:**
- Per-project context: `goal`, `decision`, `progress`, `gotcha` (4 types, survive compaction)
- Global memories: reusable patterns, preferences, gotchas — tagged and importance-ranked

**Memory Keeper pipeline** (runs on schedule via janitor):
1. **Embed** — new memories vectorized for semantic search
2. **Decay** — importance scores drift down over time if not confirmed
3. **Promote** — frequently-accessed memories rise in importance
4. **Dedup** — LLM compares similar memories, merges or supersedes stale ones

**Decay also runs at session end** via Cleanup hook — no need to wait for janitor schedule.

**Graph UI** — Next.js on `:7332`:
- `/` — force-directed graph of all memory nodes (filter by tag, project, type)
- `/project/[name]` — drill-down with Graph / Table / Board view switcher
- `/settings` — configure embedding model, dedup thresholds, janitor schedule
- `/pending` — review memories awaiting confirmation

**MCP Server** — Any MCP-compatible client (Cursor, Windsurf, Claude Desktop) can access LTM directly:
- Installed via `claude plugin marketplace add ltm` — starts automatically with Claude Code
- Toggle with `mcp.enabled` in `config.json`
- 7 tools: `ltm_recall` · `ltm_learn` · `ltm_relate` · `ltm_forget` · `ltm_context` · `ltm_graph` · `ltm_context_items`
- 4 resources: `memory://globals` · `memory://recent` · `memory://tags` · `memory://project/{name}`
- 3 prompts: `recall_before_task` · `learn_after_session` · `graph_reason`

**Key commands:**

| Command | Purpose |
|---------|---------|
| `/learn` | Store a pattern or insight in LTM |
| `/recall` | Search long-term memory before starting work |
| `/update-context` | Mid-session — log progress/decisions/gotchas |
| `/ltm-server` | Start/stop/status the graph UI |
| `/decay-report` | Show memory relevance score distribution and at-risk memories |

**Hook integration:**
- `SessionStart` — injects top project memories + importance-5 globals + quick git state at session open
- `PreCompact` — saves context-summary.md before compaction fires
- `EvaluateSession` — extracts patterns and progress at session end
- `Cleanup` — runs `decayMemories()` at session end; deprecated memories excluded from next injection
- `PrePlan` — injects topic-scoped Pre-Plan Context on every `/plan` command (see Lean Observe System)

---

## Lean Observe System

Two-part briefing system that gives Claude codebase awareness before every planning session — no API calls, no LLM, Claude interprets in-session.

```
Session opens
    │
    ▼
SessionStart (quick briefing)
    │  buildQuickBriefing(cwd)
    │  → uncommitted file count + diff summary
    │  → injected once at session open
    ▼
User types /plan <topic>
    │
    ▼
PrePlan (deep briefing)       [Option B — no overlap with SessionStart]
    │  buildDeepBriefing(cwd, project, topic)
    │  → git diff --stat + recent commits
    │  → topic-scoped LTM recalls (keyword match)
    │  → target file snippets (files mentioned in topic)
    │  → injected as ### Pre-Plan Context block
    ▼
Plan mode receives full context
```

**Design principles:**
- No overlap: PrePlan does not repeat what SessionStart already injected
- No external calls: all data gathered from git + ltm.db; Claude interprets it
- Non-fatal: if briefing fails, `/plan` continues normally

See [`docs/hooks/pre-plan.md`](docs/hooks/pre-plan.md) for full implementation details.

---

## Quick-Reference Commands

| Command | When to Use |
|---------|------------|
| `/plan` | **Always first** — before any non-trivial change |
| `/capture` | After implementation — save context + learn in one shot |
| `/simplify` | After implementation — remove complexity |
| `/verify` | Before committing — tsc + tests + security + diff |
| `/commit-push-pr` | Final step — precomputes git context |
| `/init-context` | New project — seeds goal into SQLite LTM |
| `/check-context` | Start of session — verify Claude has the right context |
| `/update-context` | Mid-session — add progress/decisions/gotchas |
| `/register-project` | Register or rename a project in the context registry |
| `/learn` | Store a pattern or insight in LTM |
| `/recall` | Search long-term memory before starting work |
| `/decay-report` | Show memory relevance score distribution and at-risk memories |
| `/hook-doctor` | Diagnose hook health — check all registered hooks |
| `/ltm-server` | Start/stop/status the LTM graph UI |
| `/goose` | Spawn parallel autonomous agents |

---

## Non-Negotiables

- **bun** not npm/yarn · **uv** not pip
- Immutability: spread operators, never mutate objects
- No hardcoded secrets — env vars only
- 80% test coverage minimum
- Conventional commits: `feat|fix|refactor|docs|chore: description`
- No `console.log` in committed code
- Long-running commands → tmux

---

## Docs

| Doc | What it covers |
|-----|---------------|
| [docs/workflow-daily.md](docs/workflow-daily.md) | Layer 1: Boris Cherny task loop, commands, agents, hooks |
| [docs/memory-short-term.md](docs/memory-short-term.md) | Layer 2: context-mode MCP — execution memory, tool guide |
| [docs/memory-long-term.md](docs/memory-long-term.md) | Layer 3: SQLite LTM — graph visualizer, commands, hooks |
| [docs/AGENT_ARCHITECTURE.md](docs/AGENT_ARCHITECTURE.md) | Multi-agent system design and orchestration patterns |

---

## About

**Rohi Rikman** — Tech Enthusiast · Cloud Security Engineer · Automation Specialist · Based in Tel Aviv.

[![GitHub](https://img.shields.io/badge/GitHub-RohiRIK-181717?style=flat&logo=github)](https://github.com/RohiRIK)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-rohi--rikman-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/rohi-rikman-48831b239/)
[![Medium](https://img.shields.io/badge/Medium-@rohi5054-000000?style=flat&logo=medium)](https://medium.com/@rohi5054)

> *☕ Powered by caffeine and questionable life choices. ☕*
