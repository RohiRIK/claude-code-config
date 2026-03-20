---
name: BackendDesign
description: "Reference for API design, database schema, and server architecture."
user-invocable: false
---

# BackendDesign

Backend architecture patterns and best practices for Bun/Hono/Drizzle/Cloudflare Workers stacks.

## Quick Reference

| Need | Load |
|------|------|
| API design, REST, validation | `API.md` |
| DB schema, queries, indexing | `Patterns.md` |
| ClickHouse streaming/analytics | `clickhouse-io.md` |
| Project-specific guidelines | `project-guidelines-example.md` |

## Workflow Routing

| Workflow | Trigger |
|----------|---------|
| **ApplyPatterns** | "apply backend pattern", "refactor backend", "how should I structure this API", "best practice for X", "design this endpoint" |

Run a workflow:
`Run the ApplyPatterns workflow`

## Key Principles (from Patterns.md)

- API routes: validate input with Zod before touching business logic
- DB: prefer Drizzle ORM with explicit schema; avoid raw SQL for user input
- Error responses: always return `{ ok: false, error: string }` — never expose stack traces
- Auth: JWT in Authorization header; never in URL params or cookies without SameSite=Strict
- Use context7 before looking up Hono/Drizzle/Zod APIs

## Integration

- Pairs with `CodingStandards/TypeScript.md` for implementation rules
- Pairs with `SecurityReview` for auth/input handling audits
- Pairs with `database-reviewer` agent for query optimisation
