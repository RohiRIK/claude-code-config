---
name: FrontendDesign
description: "Reference for React and Next.js component design patterns."
user-invocable: false
---

# FrontendDesign

React/Next.js component design patterns and performance optimisation.

## Quick Reference

| Need | Load |
|------|------|
| Component patterns, composition | `Patterns.md` |
| Context overview | `Context-Overview.md` |
| Generate a component | Run `GenerateComponent` workflow |
| Optimise performance | Run `OptimizePerformance` workflow |

## Workflow Routing

| Workflow | Trigger |
|----------|---------|
| **GenerateComponent** | "create component", "scaffold component", "new React component" |
| **OptimizePerformance** | "optimise performance", "too many re-renders", "memoize this", "virtualize list", "slow component" |

Run a workflow:
`Run the GenerateComponent workflow`
`Run the OptimizePerformance workflow`

## Key Principles (from Patterns.md)

- Composition over inheritance — build with small focused components
- Explicit `Props` types (no `any`, no implicit props spreading)
- `useMemo`/`useCallback` only when profiling shows a problem — not pre-emptively
- Virtualise lists >100 items (use `@tanstack/virtual`)
- Co-locate state as close to where it's used as possible

## Integration

- Pairs with `CodingStandards/TypeScript.md` for TS rules in components
- Pairs with `code-reviewer` agent after building new components
- Pairs with `SecurityReview` for XSS/input sanitisation in forms
