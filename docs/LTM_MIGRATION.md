# LTM — Moved to `RohiRIK/claude-ltm-plugin`

> **The LTM implementation now lives in a separate repository.**
> Canonical source of truth: **[RohiRIK/claude-ltm-plugin](https://github.com/RohiRIK/claude-ltm-plugin)**

---

## What Moved

The following components are now owned and maintained in `RohiRIK/claude-ltm-plugin`:

| Component | Details |
|-----------|---------|
| SQLite DB schema & migrations | `memory/schema.sql`, `memory/migrate.ts` |
| Core DB helpers | `memory/db.ts` — `learn()`, `recall()`, `decayMemories()`, etc. |
| MCP server | `memory/mcp-server.ts` — STDIO LTM MCP adapter |
| REST/WebSocket API server | `memory/server.ts` — port 7331 |
| Graph UI | `memory/graph-app/` — Next.js app on port 7332 |
| Janitor pipeline | `memory/janitor/` — decay, promote, dedup, supersedes |
| Provider system | `memory/janitor/providers/` — Gemini, OpenAI, Anthropic, Cohere, Ollama, OpenRouter |
| Embedding helpers | `memory/embeddings.ts` — `embedText()`, `getSimilarMemories()` |
| Recall flow details | FTS5 + semantic fallback implementation |
| Settings keys reference | `ltm.*` config keys |

---

## What Stays in This Repo

`RohiRIK/claude-code-config` owns:

- Claude Code config — `settings.json`, `config.json`, rules, commands
- Agents — `agents/` definitions (planner, architect, code-simplifier, etc.)
- Skills — `skills/` (Art, CodingStandards, Goose, etc.)
- Hooks — `hooks/` (SessionStart, PreCompact, EvaluateSession, Cleanup, etc.)
- Context files — `~/.claude/projects/<name>/context-*.md`
- Integration with LTM — how hooks call into the MCP server, how context is injected
- This documentation

---

## Ownership Boundary

```
RohiRIK/claude-code-config          RohiRIK/claude-ltm-plugin
────────────────────────────         ──────────────────────────
agents / skills / hooks              SQLite DB + schema
commands / rules                     MCP server (STDIO)
context file management              REST API (port 7331)
hook → MCP integration               Graph UI (port 7332)
workflow docs                        Janitor pipeline
                                     Provider system
                                     Recall / embed logic
```

---

## For Users of This Repo

### Setup / Installation
See **[RohiRIK/claude-ltm-plugin](https://github.com/RohiRIK/claude-ltm-plugin)** for:
- How to install and run the LTM server
- MCP server registration
- API key configuration
- Janitor setup

### Integration from This Repo
The hooks in this repo (`SessionStart`, `PreCompact`, `EvaluateSession`, `Cleanup`) call into the LTM MCP server.
The MCP server must be running (or registered via `claude mcp add`) for LTM features to work.

### Troubleshooting LTM Issues
All LTM internals (DB corruption, recall problems, janitor failures, graph UI issues) — go to **[RohiRIK/claude-ltm-plugin](https://github.com/RohiRIK/claude-ltm-plugin)**.

---

## Historical Docs in This Repo

The following docs were accurate when LTM lived here. They now serve as **historical context only**:

| Doc | Status |
|-----|--------|
| `docs/memory-long-term.md` | Historical — implementation details moved to plugin repo |
| `docs/ltm-recall-flow.md` | Historical — recall implementation details moved to plugin repo |

These are preserved for context. For current implementation details, see the plugin repo.

---

*Last updated: 2026-03-26*
