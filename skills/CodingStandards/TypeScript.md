# TypeScript Standards

**Runtime:** Bun — `bun run`, `bun add`, `bun build`. Never Node.js.

## Types

- Prefer `type` over `interface` for data shapes; use `interface` only for extension contracts
- Use `satisfies` to validate literals without widening
- Avoid `any` — use `unknown` with type narrowing
- Exported functions MUST have explicit return types
- Use discriminated unions over long optional-chaining chains

```typescript
// ✅ Discriminated union
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// ❌ Optional mess
type Result<T> = { value?: T; error?: string };
```

## Naming

| Pattern | Use |
|---------|-----|
| `camelCase` | Variables, functions |
| `PascalCase` | Types, classes, components |
| `SCREAMING_SNAKE_CASE` | Constants, env vars |
| `kebab-case.ts` | File names |

Booleans must start with: `is`, `has`, `can`, `should`.

## Async

- Always `async/await` — no raw `.then()/.catch()` chains
- Never `await` inside a loop — batch with `Promise.all()`
- Always type the resolved value: `Promise<User[]>` not `Promise<any>`
- Use `Result<T, E>` for recoverable errors — don't throw for expected failures

## Imports

- Named exports only — no `export default` except for pages/components
- Group: `node:*` → external packages → internal (blank line between each group)
- Absolute paths via `tsconfig.json` paths — no `../../..` chains
- Never `export * from` — be explicit

```typescript
import { readFile } from "node:fs/promises";

import { z } from "zod";
import { Hono } from "hono";

import { db } from "~/lib/db";
import type { User } from "~/types/user";
```

## Error Handling

```typescript
export async function getUser(id: string): Promise<User | null> {
  try {
    return await db.query.users.findFirst({ where: eq(users.id, id) }) ?? null;
  } catch (err) {
    throw new Error(`Failed to fetch user ${id}: ${String(err)}`);
  }
}
```

## Context7

Always prepend `use context7` when looking up: Bun APIs, Zod schemas, Hono routes, Drizzle ORM, Cloudflare Workers bindings.
