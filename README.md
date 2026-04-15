# ~/.claude — Claude Code Global Config

> A 4-layer system that gives Claude persistent memory, structured workflows, and automatic context — so sessions can resume with full context of past decisions and progress.

> Personal Claude Code setup by [Rohi Rikman](https://github.com/RohiRIK). Applies to all projects.
> Last updated: 2026-04-15

![Claude Config Header](assets/claude-config-header.png)

---

## Quick Start

**Prerequisites:** [Claude Code](https://claude.ai/code), [Bun](https://bun.sh)

```bash
# 1. Clone to your Claude config directory
git clone https://github.com/RohiRIK/claude-code-config.git ~/.claude

# 2. Install context-mode (execution memory)
/plugin install context-mode@context-mode

# 3. Install LTM plugin (long-term memory)
claude plugin marketplace add https://github.com/RohiRIK/claude-ltm-plugin
claude plugin install ltm
```

> For full LTM setup, commands, and configuration — see [claude-ltm-plugin](https://github.com/RohiRIK/claude-ltm-plugin).

---

## Philosophy

This project is three things at once:

**1. A living system for Claude Code**
A continuously improved setup — skills, hooks, commands, and flows — built and refined session by session. Not a one-time config. A system that gets smarter the more I use it.

**2. Giving Claude a real brain**
I wanted Claude to remember. Not just within a session, but across weeks and projects. That meant building a long-term memory layer (SQLite LTM, now [`claude-ltm-plugin`](https://github.com/RohiRIK/claude-ltm-plugin)) and pairing it with a short-term execution memory ([`context-mode`](https://github.com/mksglu/context-mode) — genuinely awesome plugin). Together they give Claude the context awareness a real collaborator would have.

**3. Learning in public**
The LTM stays private — but the process is open. How I work, how I think through problems, how this system evolved session by session — that's what's visible in the git history and the decisions baked into the config. This repo is my process as much as it is a product. If it helps someone else build something better, even better.

> The LTM is the brain. The hooks are the reflexes. The workflow is the discipline.

---

## 4-Layer Architecture

```
                                          ~/.claude
                                              │
       ┌──────────────────┬──────────────────┼──────────────────┐
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
 ┌───────────┐    ┌──────────────┐    ┌───────────┐    ┌───────────────┐
 │  LAYER 1  │    │   LAYER 2    │    │  LAYER 3  │    │   LAYER 4     │
 │  WORKFLOW │    │ DEV WORKFLOW │    │ SHORT-TERM│    │  LONG-TERM    │
 │           │    │              │    │  MEMORY   │    │   MEMORY      │
 │  Boris    │    │ /spec→/plan  │    │context-   │    │ claude-ltm-   │
 │  Cherny   │    │ →/build /dev │    │mode plugin│    │   plugin      │
 │ task loop │    │              │    │           │    │               │
 └─────┬─────┘    └──────┬───────┘    └─────┬─────┘    └───────┬───────┘
       │                 │                  │                  │
       ▼                 ▼                  ▼                  ▼
 [observe] auto    /test (ProveIt      cmd→subprocess    ltm.db (SQLite)
 /plan→implement    or FeatureTdd)    → BM25 index      → PreCompact
 → /capture        → /simplify        → summaries       → SessionStart
 → /simplify       → /capture         → context         → /learn /recall
 → /verify         → /commit-push-pr                    → graph UI :7332
 → /commit-push-pr
```

> "A good plan is really important. Claude typically 1-shots implementation from a well-formed plan." — Boris Cherny

---

## What's Inside

**Workflow** — The Boris Cherny task loop: `/plan → implement → /capture → /simplify → /verify → /commit-push-pr`. Plan first, always. Claude typically 1-shots implementation from a solid plan.

**Short-Term Memory** — [`context-mode`](https://github.com/mksglu/context-mode) plugin. Every command runs in a sandbox subprocess, BM25-indexed, summarized. No context bloat.

**Long-Term Memory** — [`claude-ltm-plugin`](https://github.com/RohiRIK/claude-ltm-plugin). SQLite-backed memory that survives compaction. Stores goals, decisions, gotchas, and patterns — per project and globally. Decays unused memories, promotes important ones, deduplicates with LLM. Visualized as a force-directed graph on `:7332`.

**Lean Observe System** — Before every `/plan`, hooks auto-inject codebase context: git state, recent commits, relevant LTM memories, and target file snippets. No API calls. Claude interprets it in-session.

**Skills & Agents** — Coding standards, prompting guides, and specialized agents (`planner`, `code-reviewer`, `tdd-guide`, and more) that trigger automatically when relevant.

---

## Quick-Reference Commands

**Workflow**

| Command | When to Use |
|---------|------------|
| `/spec` | Define what to build — acceptance criteria before planning |
| `/plan` | Before any non-trivial change |
| `/build` | Implement one task at a time — TDD → compile gate → commit |
| `/dev` | Full automation — all tasks + final regression sweep |
| `/test` | Standalone bug fix (ProveIt) or feature TDD |
| `/simplify` | After implementation — remove complexity |
| `/verify` | Before committing — tsc + tests + security + diff |
| `/commit-push-pr` | Final step |

**Code Quality**

| Command | When to Use |
|---------|------------|
| `/code-review` | Review code for quality and security |
| `/build-fix` | Fix TypeScript or build errors |
| `/refactor-clean` | Remove dead code and unused exports |
| `/e2e` | Generate or run Playwright E2E tests |
| `/audit` | Security and quality audit |
| `/goose` | Spawn parallel autonomous agents |

**LTM plugin commands** (`/learn`, `/recall`, `/decay-report`, `/ltm-server`) live in [claude-ltm-plugin](https://github.com/RohiRIK/claude-ltm-plugin).

---

## Docs

| Doc | What it covers |
|-----|---------------|
| [docs/README.md](docs/README.md) | Full index — all layers, agents, hooks, and skills |
| [CHANGELOG.md](CHANGELOG.md) | What changed and when |

---

## About

**Rohi Rikman** — Tech Enthusiast · Cloud Security Engineer · Automation Specialist · Based in Tel Aviv.

[![GitHub](https://img.shields.io/badge/GitHub-RohiRIK-181717?style=flat&logo=github)](https://github.com/RohiRIK)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-rohi--rikman-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/rohi-rikman-48831b239/)
[![Medium](https://img.shields.io/badge/Medium-@rohi5054-000000?style=flat&logo=medium)](https://medium.com/@rohi5054)

Inspired by [danielmiessler/Personal\_AI\_Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure), [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), and [Google Always-On Memory Agent](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/gemini/agents/always-on-memory-agent).

> *☕ Powered by caffeine and questionable life choices. ☕*
