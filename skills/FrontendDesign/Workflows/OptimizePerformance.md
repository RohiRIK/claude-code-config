# OptimizePerformance Workflow

Analyse a component or code snippet and suggest concrete performance improvements.

## Steps

1. **Profile first** — ask which component is slow or accept a code snippet
2. **Load patterns** — read `Patterns.md` for memoization and virtualization strategies
3. **Identify root cause**:
   - Unnecessary re-renders → `useMemo`, `useCallback`, `React.memo`
   - Large list rendering → `@tanstack/virtual` or windowing
   - Heavy computation on render → move to `useMemo` or a Web Worker
   - Prop drilling causing wide re-renders → lift to context or Zustand
4. **Suggest changes** — show before/after with explanation
5. **Warn against premature optimisation** — only apply when profiling confirms the issue

## Output Format

```
## Performance Analysis

**Root cause:** [identified issue]

**Before:**
[code snippet]

**After:**
[optimised snippet]

**Why:** [explanation]

**Measure:** [how to verify improvement — React DevTools Profiler / Lighthouse]
```
