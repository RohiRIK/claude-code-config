---
feature: docs/workflow-dev.md
created: 2026-04-10
---

# Spec: Dev Workflow Doc

## What

Add `docs/workflow-dev.md` as a second workflow doc alongside `docs/workflow-daily.md`.
It documents the new `/spec → /plan → /build|/dev → /test → /simplify → /capture → /commit-push-pr` workflow — the plan-aware, TDD-gated, incremental build loop introduced this session.

Also update:
- `README.md` docs table — add a row for `workflow-dev.md`
- `README.md` `## Development Workflow` section — link to the new doc

## Existing Context

- `docs/workflow-daily.md` — covers the Boris Cherny task loop. Structure: intro → Flow (ASCII) → Step by Step (one section per command) → All Commands table → Agents → Hooks
- File naming: lowercase hyphen (e.g. `workflow-daily.md`, `memory-long-term.md`)
- ASCII diagrams used throughout docs — no screenshots
- LTM constraint: `docs/CHANGELOG.md` must NOT be recreated (deleted 2026-03-11)
- README docs table at line ~166 currently has one workflow entry: `workflow-daily.md`

## New file: `docs/workflow-dev.md`

Match the structure of `workflow-daily.md`:

### Structure
1. **Title + intro** — "The plan-aware build loop. Spec first, build in slices, gate on tests."
2. **Flow** — ASCII flowchart (reuse the one from README `## Development Workflow`)
3. **Step by Step** — one section per command:
   - `/spec` — LTM recall + codebase explore → acceptance criteria in `specs/`
   - `/plan` — task breakdown from spec
   - `/build` — per-task: TDD → compile gate → commit (single-task manual mode)
   - `/dev` — full automation: build loop + final test sweep
   - `/test` — standalone: FeatureTdd or ProveIt (bug fix)
   - `/simplify` — post-implementation cleanup
   - `/capture` — save context + learn in LTM
   - `/commit-push-pr` — final ship
4. **When to use /build vs /dev vs /test** — decision table (same as README)
5. **Skills invoked** — table: command → backing skill → workflow file
6. **Relation to workflow-daily** — one paragraph: this workflow sits inside the daily loop, replacing the freeform "implement" step with structured slices

## Acceptance Criteria

1. `docs/workflow-dev.md` exists with all 6 sections above
2. Structure mirrors `workflow-daily.md` (same heading depth, same section order pattern)
3. ASCII flowchart matches the one already in README `## Development Workflow`
4. README docs table has a new row: `[docs/workflow-dev.md](docs/workflow-dev.md) | Dev build loop — /spec, /build, /dev, /test and their backing skills`
5. README `## Development Workflow` section ends with a link: `→ [Full doc](docs/workflow-dev.md)`
6. No new files created outside `docs/` and `specs/`
7. `docs/CHANGELOG.md` not touched

## Hand off

→ `/plan` with this spec to break into tasks
