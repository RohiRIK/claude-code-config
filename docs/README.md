# Docs Index

Full reference for `~/.claude`. Organized by the 4-layer architecture.

---

## Layer 1 — Daily Workflow
Boris Cherny method: plan → implement → simplify → verify → commit.

| Doc | What it covers |
|-----|---------------|
| [workflow-daily.md](workflow-daily.md) | The task loop, commands, agents, and hooks that run every session |

---

## Layer 2 — Dev Workflow
Feature development cycle: `/spec → /plan → /build / /dev → /test → /simplify → /capture → /commit-push-pr`.

| Doc | What it covers |
|-----|---------------|
| [workflow-dev.md](workflow-dev.md) | `/spec`, `/build`, `/dev`, `/test` commands and backing skills |
| [AGENT_ARCHITECTURE.md](AGENT_ARCHITECTURE.md) | Multi-agent system design and orchestration patterns |

---

## Layer 3 — Short-Term Memory
`context-mode` MCP plugin — commands run in a sandbox subprocess, BM25-indexed, summarized.

| Doc | What it covers |
|-----|---------------|
| [memory-short-term.md](memory-short-term.md) | context-mode tool guide, when to use each tool, diagnostics |

---

## Layer 4 — Long-Term Memory
`claude-ltm-plugin` — SQLite-backed memory that survives compaction. Goals, decisions, gotchas, patterns.

| Doc | What it covers |
|-----|---------------|
| [memory-long-term.md](memory-long-term.md) | LTM commands, graph UI, hooks, decay and promotion |
| [ltm-recall-flow.md](ltm-recall-flow.md) | How recall FTS5 + semantic fallback works |
| [LTM_MIGRATION.md](LTM_MIGRATION.md) | Migration history and schema changes |

---

## Agents

Specialized sub-agents invoked automatically or via the `Agent` tool.

→ [agents/README.md](agents/README.md) — full index of all 12 agents

---

## Hooks

Lifecycle scripts that fire at specific Claude Code events.

→ [hooks/README.md](hooks/README.md) — full index of all hooks with triggers
→ [hooks/overview.md](hooks/overview.md) — hook inventory and lifecycle diagram
→ [hooks/pre-plan.md](hooks/pre-plan.md) — Lean Observe System (PrePlan + SessionStart briefing)

---

## Skills

Reference guides and workflow orchestrators invoked via the `Skill` tool.

→ [skills/README.md](skills/README.md) — full index of all 15 skills

---

## Auditor

| Doc | What it covers |
|-----|---------------|
| [auditor/overview.md](auditor/overview.md) | Session auditor — scoring, reports, findings |
