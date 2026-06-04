# Common Patterns

## Memory-First Rule

Before any architectural decision or pattern choice:
1. `/recall [topic]` — check for prior decisions on this topic
2. If prior decision exists: follow it (don't re-invent)
3. If no prior decision: make one, then `/learn --category architecture`

This prevents contradictory decisions across sessions.

## API Response Format
`{ success, data?, error?, meta?: { total, page, limit } }`

## Custom Hooks
Use `useState` + `useEffect` with cleanup. Example: `useDebounce(value, delay)`.

## Repository Pattern
Interface: `findAll`, `findById`, `create`, `update`, `delete`.

## Skeleton Projects
When implementing new functionality:
1. Search for battle-tested skeleton projects
2. Use parallel agents to evaluate: security, extensibility, relevance
3. Clone best match, iterate within proven structure

## Memory Integration

Before any pattern choice: `/recall [pattern name]` — check if this pattern was previously evaluated.
After validating a pattern works well in this codebase: `/learn --category pattern`.
