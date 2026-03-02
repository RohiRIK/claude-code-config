# ~/.claude — Claude Code Global Config

> Personal Claude Code setup by [Rohi Rikman](https://github.com/RohiRIK). Applies to all projects.
> Last updated: 2026-03-02
>
> Inspired by [danielmiessler/Personal\_AI\_Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure) and [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ██╗  ██╗██╗  ██╗ ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗   │
│   ██║  ██║╚██╗██╔╝██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝   │
│   ███████║ ╚███╔╝ ██║     ██║     ███████║██║   ██║██║  ██║█████╗     │
│   ██╔══██║ ██╔██╗ ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝     │
│   ██║  ██║██╔╝ ██╗╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗   │
│   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝   │
│                                                                         │
│              Global Claude Code Config  ·  ~/.claude                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

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
  │ Boris Cherny│   │context-mode │   │session context  │
  │  task loop  │   │    MCP      │   │ + learning loop │
  └──────┬──────┘   └──────┬──────┘   └───────┬─────────┘
         │                  │                  │
         ▼                  ▼                  ▼
  /plan → implement   cmd → subprocess   context-*.md
  → /simplify         → BM25 index       → PreCompact
  → /verify           → summaries        → SessionStart
  → /commit-push-pr   → context          → /compact
                                         → restore
         │                  │                  │
         ▼                  ▼                  ▼
  workflow-daily.md  memory-short-term.md  memory-long-term.md
```

> "A good plan is really important. Claude typically 1-shots implementation from a well-formed plan." — Boris Cherny

---

## Quick-Reference Commands

| Command | When to Use |
|---------|------------|
| `/plan` | **Always first** — before any non-trivial change |
| `/simplify` | After implementation — remove complexity |
| `/verify` | Before committing — tsc + tests + security + diff |
| `/commit-push-pr` | Final step — precomputes git context |
| `/tdd` | New features — writes tests FIRST |
| `/code-review` | After writing code |
| `/init-context` | New project — creates 4 context files |
| `/check-context` | Start of session — verify Claude has the right context |
| `/update-context` | End of session — auto-extract progress/decisions/gotchas |
| `/register-project` | Register or rename a project in the context registry |
| `/learn` | End of session — extract reusable patterns |
| `/e2e` | Critical user flows — Playwright tests |
| `/build-fix` | When build fails |
| `/refactor-clean` | Remove dead code |
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
| [docs/memory-long-term.md](docs/memory-long-term.md) | Layer 3: session context loop + learning loop |
| [docs/AGENT_ARCHITECTURE.md](docs/AGENT_ARCHITECTURE.md) | Multi-agent system design and orchestration patterns |

---

## About

**Rohi Rikman** — Tech Enthusiast · Cloud Security Engineer · Automation Specialist · Based in Tel Aviv.

[![GitHub](https://img.shields.io/badge/GitHub-RohiRIK-181717?style=flat&logo=github)](https://github.com/RohiRIK)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-rohi--rikman-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/rohi-rikman-48831b239/)
[![Medium](https://img.shields.io/badge/Medium-@rohi5054-000000?style=flat&logo=medium)](https://medium.com/@rohi5054)

> *Powered by caffeine and questionable life choices.*
