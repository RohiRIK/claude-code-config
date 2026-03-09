# /recall - Search Long-Term Memory

Search stored memories by text query, tags, category, or project.

## Usage

```
/recall [query] [--tags t1,t2] [--category gotcha] [--project name] [--limit 10]
```

## Examples

```
/recall bun sqlite
/recall --category gotcha --project claude-config
/recall filesystem mcp --tags mcp,filesystem
/recall --limit 5 auth
```

## Process

1. Parse arguments from the user's invocation
2. Call `recall()` from `~/.claude/memory/db.ts`:
   ```typescript
   import { recall } from "~/.claude/memory/db.js";
   const results = recall({
     query: "bun sqlite",
     category: "gotcha",        // optional
     project: "claude-config",  // optional — includes globals + project-scoped
     tags: ["mcp"],             // optional
     limit: 10,
   });
   ```
3. For each result, display:
   - ID, content, category, importance (★), confidence, confirmed count
   - Tags
   - Graph neighbours (related memories with relationship type)

## Output Format

```
## Memory Results

| ID | Content | Category | Importance | Confirmed |
|----|---------|----------|------------|-----------|
| 3  | bun is always preferred over npm | preference | ★★★★★ | 4x |

**Tags:** bun, package-manager
**Relations:**
  → [7] "uv is preferred over pip" (supports)
```

## Notes

- FTS5 query supports `AND`, `OR`, `NOT`, and phrase matching: `"bun sqlite"`
- Results ranked by: FTS relevance → importance → confidence
- Use `/recall` before starting on a topic to surface relevant past decisions
