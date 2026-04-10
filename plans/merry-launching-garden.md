# Plan: docs/workflow-dev.md

## Context

The new `/spec → /plan → /build|/dev → /test → /simplify → /capture → /commit-push-pr` workflow was built this session (commands + skills). It needs a proper doc in `docs/` alongside the existing `workflow-daily.md` so users can reference it. The README `## Development Workflow` section already has the ASCII flowchart but no link to a full doc.

---

## Files to Create

| File | Description |
|------|-------------|
| `docs/workflow-dev.md` | Full doc for the dev build loop |

## Files to Modify

| File | Change |
|------|--------|
| `README.md` | Add row to docs table + link at end of `## Development Workflow` section |

---

## `docs/workflow-dev.md` Structure

Mirror `docs/workflow-daily.md` exactly (same heading depth, same section order):

1. **Title + one-line intro** — "The plan-aware build loop. Spec first, build in slices, gate on tests."
2. **Flow** — reuse ASCII flowchart from README `## Development Workflow` verbatim
3. **Step by Step** — one `###` section per command:
   - `/spec` — `ltm_recall` + Explore agent → `specs/<slug>.md` with acceptance criteria
   - `/plan` — task breakdown from spec acceptance criteria
   - `/build` — per task: TDD (`TddWorkflow:RedGreenRefactor`) → `bunx tsc --noEmit` → `bun test` (regression) → commit → next task
   - `/dev` — full automation: build loop for all tasks → final `Test:FeatureTdd` sweep → report
   - `/test` — standalone: `FeatureTdd` (new feature) or `ProveIt` (bug fix — failing test first)
   - `/simplify` — post-implementation cleanup
   - `/capture` — save context + learn in LTM
   - `/commit-push-pr` — final ship
4. **When to use /build vs /dev vs /test** — decision table (3 rows)
5. **Skills invoked** — table mapping command → skill → workflow file
6. **Relation to workflow-daily** — one paragraph: this sits inside the daily loop, replacing the freeform "implement" step

## README Changes

**Docs table** (around line 170) — add after the `workflow-daily.md` row:
```
| [docs/workflow-dev.md](docs/workflow-dev.md) | Dev build loop — /spec, /build, /dev, /test and backing skills |
```

**`## Development Workflow` section** — add at the very end, after the decision table:
```
→ [Full doc: docs/workflow-dev.md](docs/workflow-dev.md)
```

---

## Constraints (from LTM + spec)

- ASCII diagrams only — no screenshots
- `docs/CHANGELOG.md` must NOT be created
- File naming: `workflow-dev.md` (matches `workflow-daily.md` pattern)
- No files outside `docs/` and `README.md`

---

## Verification

1. `docs/workflow-dev.md` exists and has all 6 sections
2. README docs table has the new row
3. README `## Development Workflow` ends with the link
4. `docs/CHANGELOG.md` does not exist
