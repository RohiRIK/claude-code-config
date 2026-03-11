# Workflow & Execution Rules

## Context-Safe Execution (MANDATORY)

A `context-mode` MCP server is installed. Use it to prevent context window bloat
from large command outputs. It runs commands in an isolated subprocess and returns
only summaries — NOT raw output.

### Use `mcp__context_mode__execute` instead of Bash when:
- Running tests: `bun test`, `vitest`, `pytest`, `bun run test`
- Build commands that produce > ~1 KB output
- Type-checking: `bunx tsc --noEmit`
- Linters across many files: `bunx biome check .`
- Reading or processing large log/error dumps
- Any command where raw output is not needed directly

### Use `mcp__context_mode__batch_execute` when:
- Running multiple independent commands in one call
  (e.g., tsc + bun test + biome check simultaneously)

### Use `mcp__context_mode__execute_file` when:
- Processing a file's contents without reading raw text into context

### Use `mcp__context_mode__fetch_and_index` + `mcp__context_mode__search` when:
- Fetching large documentation pages (prefer over WebFetch for pages > ~5 KB)

### Bash is still appropriate for:
- Short diagnostic commands: `git status`, `git log --oneline -5`, `ls`, `which bun`
- Commands where raw output IS needed (e.g., `cat package.json`, `git diff HEAD~1`)
- Interactive/TTY commands

## Maintaining context-mode

The MCP server runs from a **pre-built bundle** (`server.bundle.mjs`), NOT from source.
After editing any file in `~/.claude/plugins/marketplaces/claude-context-mode/src/`:

```bash
cd ~/.claude/plugins/marketplaces/claude-context-mode
bunx esbuild src/server.ts --bundle --platform=node --target=node18 --format=esm \
  --outfile=server.bundle.mjs \
  --external:better-sqlite3 --external:turndown --external:turndown-plugin-gfm \
  --external:@mixmark-io/domino --external:zod --external:@modelcontextprotocol/sdk \
  --minify
pkill -f "server.bundle.mjs"   # Claude Code auto-restarts it on next tool use
```

Then restart Claude Code (or wait for auto-reconnect) to pick up the new bundle.

## Diagnostics
- `/context-mode:stats` — token savings breakdown per tool
- `/context-mode:doctor` — runtime health check, confirms tool registration

## Writing Prompts or Instructions

When writing system prompts, rule files, instruction sets, or Claude skill content:
Load the **Prompting** skill (`Skill tool: "Prompting"`) to apply prompt engineering best practices before drafting.
