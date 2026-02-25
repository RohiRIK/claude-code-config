# build-error-resolver

**Agent:** Build and TypeScript error resolution specialist.

**Model:** opus

**Description:** Build and TypeScript error resolution specialist. Use PROACTIVELY when build fails or type errors occur. Fixes build/type errors only with minimal diffs, no architectural edits.

---

## Overview

The build-error-resolver agent quickly fixes TypeScript, compilation, and build errors with minimal changes. Focus is on speed and precision - get the build green fast without architectural changes.

## When to Invoke

| Trigger | Context |
|---------|---------|
| Build failure | `npm run build` fails |
| Type errors | `tsc --noEmit` shows errors |
| Import errors | Module resolution failures |
| Configuration errors | tsconfig, webpack, next.config issues |
| Dependency conflicts | Package version issues |

## What It Does

### 1. Collects All Errors
- Runs full type check
- Captures ALL errors, not just first
- Categorizes by type:
  - Type inference failures
  - Missing type definitions
  - Import/export errors
  - Configuration errors

### 2. Fixes Strategically
For each error:
1. Understand the error message
2. Find minimal fix (add annotation, fix import, null check)
3. Verify doesn't break other code
4. Iterate until build passes

### 3. Minimal Diff Principle
**DO:**
- Add type annotations
- Fix imports/exports
- Add null checks
- Add missing dependencies

**DON'T:**
- Refactor unrelated code
- Change architecture
- Rename variables/functions
- Add new features

## Common Error Patterns

### Type Inference
```typescript
// ❌ ERROR: implicit 'any'
function add(x, y) { return x + y }

// ✅ FIX
function add(x: number, y: number): number { return x + y }
```

### Null/Undefined
```typescript
// ❌ ERROR: possibly undefined
const name = user.name.toUpperCase()

// ✅ FIX
const name = user?.name?.toUpperCase()
```

### Import Errors
```typescript
// ❌ ERROR: Cannot find module
import { foo } from '@/lib/utils'

// ✅ FIX: Check tsconfig paths or use relative import
```

### Generic Constraints
```typescript
// ❌ ERROR: T not assignable
function getLength<T>(item: T): number { return item.length }

// ✅ FIX: Add constraint
function getLength<T extends { length: number }>(item: T): number
```

## Diagnostic Commands

```bash
# TypeScript check
npx tsc --noEmit

# Check specific file
npx tsc --noEmit path/to/file.ts

# Next.js build
npm run build

# ESLint check
npx eslint . --ext .ts,.tsx,.js,.jsx
```

## Priority Levels

| Priority | Description | Action |
|----------|-------------|--------|
| 🔴 CRITICAL | Build completely broken | Fix immediately |
| 🟡 HIGH | Single file failing | Fix soon |
| 🟢 MEDIUM | Linter warnings | Fix when possible |

## Related

- **Invoked by:** Claude automatically on build failure
- **DON'T use for:** Refactoring, new features, security issues
- **See also:** [code-reviewer](code-reviewer.md), [tdd-guide](tdd-guide.md)

---

*Documentation generated from `agents/build-error-resolver.md` - Last updated: 2026-02-25*
