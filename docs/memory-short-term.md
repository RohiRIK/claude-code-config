# Layer 2: Short-Term Memory (context-mode MCP)

The context-mode MCP server prevents large command outputs from bloating the context window. Commands run in an isolated subprocess; only summaries enter context.

---

## Flow

```
╔══════════════════════════════════════════════════════════════════════╗
║  LAYER 2 · SHORT-TERM MEMORY  (context-mode MCP)                     ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║    Claude issues command                                             ║
║      ↓                                                               ║
║    context-mode subprocess runs it in isolation                      ║
║      ↓                                                               ║
║    Output → BM25 full-text index (stays in subprocess)               ║
║      ↓                                                               ║
║    Claude searches index with queries                                ║
║      ↓                                                               ║
║    Only matching summaries enter context window                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Tool Guide

### `mcp__context-mode__execute` — Run a command
Use instead of Bash when output might be large (> ~1 KB):
- Tests: `bun test`, `vitest`, `pytest`
- Type-checking: `bunx tsc --noEmit`
- Linters: `bunx biome check .`
- Build commands with verbose output
- Any log/error dumps

```typescript
// GOOD: large output stays out of context
execute({ language: "shell", code: "bun test", intent: "failing tests" })

// BAD: raw output floods context
Bash({ command: "bun test" })
```

### `mcp__context-mode__batch_execute` — Run multiple commands in one call
Use when running independent commands that can execute simultaneously:
- `tsc + bun test + biome check` in parallel
- Multiple `git` queries at once

### `mcp__context-mode__execute_file` — Process a file without reading it
Use when you need to extract specific information from a file without loading the full content into context:
- Large log files
- Data files (CSV, JSON, XML)
- Large source files for analysis

### `mcp__context-mode__index` — Index documentation
Use for reference material you'll need to query repeatedly:
- Context7 docs / API references
- README files or migration guides
- MCP tool/list output

### `mcp__context-mode__search` — Query indexed content
After indexing, retrieve specific sections on demand. Batch all queries in one call.

### `mcp__context-mode__fetch_and_index` — Fetch + index a URL
Better than WebFetch for pages > ~5 KB. Converts HTML to markdown, indexes it, returns a 3 KB preview. Full content is searchable via `search`.

---

## Bash vs context-mode Decision Table

| Situation | Tool |
|-----------|------|
| `git status`, `git log --oneline -5`, `ls` | Bash (short output, raw needed) |
| `cat package.json`, `git diff HEAD~1` | Bash (raw output needed) |
| `bun test` | context-mode execute |
| `bunx tsc --noEmit` | context-mode execute |
| `bunx biome check .` | context-mode execute |
| Multiple independent commands | context-mode batch_execute |
| Large file analysis | context-mode execute_file |
| Large docs page | context-mode fetch_and_index + search |
| Writing/editing files | Bash or Write/Edit tool |
| Interactive/TTY commands | Bash |

---

## Diagnostics

- `/context-mode:stats` — token savings breakdown per tool call
- `/context-mode:doctor` — runtime health check, confirms tool registration

you can refer to the the [docs](https://github.com/mksglu/claude-context-mode) for more information