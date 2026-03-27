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
  [observe] auto       cmd → subprocess   ltm.db (SQLite)
  /plan → implement   → BM25 index       → PreCompact
  → /capture          → summaries        → SessionStart
  → /simplify         → context          → /learn /recall
  → /verify                              → graph UI :7332
  → /commit-push-pr
```

> "A good plan is really important. Claude typically 1-shots implementation from a well-formed plan." — Boris Cherny

---

## Quick Start

**Prerequisites:** [Claude Code](https://claude.ai/code), [Bun](https://bun.sh)

```bash
# 1. Clone to your Claude config directory
git clone https://github.com/RohiRIK/claude-code-config.git ~/.claude

# 2. Install plugins
claude plugin marketplace add context-mode
claude plugin marketplace add ltm

# 3. Register your first project (run inside any project directory)
/register-project

# 4. Optional — start the LTM graph UI
/ltm-server start
```

---

## What's Inside

**Workflow** — The Boris Cherny task loop: `/plan → implement → /capture → /simplify → /verify → /commit-push-pr`. Plan first, always. Claude typically 1-shots implementation from a solid plan.

**Short-Term Memory** — [`context-mode`](https://github.com/mksglu/context-mode) plugin. Every command runs in a sandbox subprocess, BM25-indexed, summarized. No context bloat.

**Long-Term Memory** — [`claude-ltm-plugin`](https://github.com/RohiRIK/claude-ltm-plugin). SQLite-backed memory that survives compaction. Stores goals, decisions, gotchas, and patterns — per project and globally. Decays unused memories, promotes important ones, deduplicates with LLM. Visualized as a force-directed graph on `:7332`.

**Lean Observe System** — Before every `/plan`, hooks auto-inject codebase context: git state, recent commits, relevant LTM memories, and target file snippets. No API calls. Claude interprets it in-session.

**Skills & Agents** — Coding standards, prompting guides, and specialized agents (`planner`, `code-reviewer`, `tdd-guide`, and more) that trigger automatically when relevant.

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

## Docs

| Doc | What it covers |
|-----|---------------|
| [docs/workflow-daily.md](docs/workflow-daily.md) | Layer 1: Boris Cherny task loop, commands, agents, hooks |
| [docs/memory-short-term.md](docs/memory-short-term.md) | Layer 2: context-mode MCP — execution memory, tool guide |
| [docs/memory-long-term.md](docs/memory-long-term.md) | Layer 3: SQLite LTM — graph visualizer, commands, hooks |
| [docs/AGENT_ARCHITECTURE.md](docs/AGENT_ARCHITECTURE.md) | Multi-agent system design and orchestration patterns |
| [docs/hooks/pre-plan.md](docs/hooks/pre-plan.md) | Lean Observe System — how PrePlan + SessionStart briefing works |
| [docs/hooks/overview.md](docs/hooks/overview.md) | Full hook inventory |
| [CHANGELOG.md](CHANGELOG.md) | What changed and when |

---

## About

**Rohi Rikman** — Tech Enthusiast · Cloud Security Engineer · Automation Specialist · Based in Tel Aviv.

[![GitHub](https://img.shields.io/badge/GitHub-RohiRIK-181717?style=flat&logo=github)](https://github.com/RohiRIK)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-rohi--rikman-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/rohi-rikman-48831b239/)
[![Medium](https://img.shields.io/badge/Medium-@rohi5054-000000?style=flat&logo=medium)](https://medium.com/@rohi5054)

> *☕ Powered by caffeine and questionable life choices. ☕*
