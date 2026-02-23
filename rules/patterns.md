# Common Patterns

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
