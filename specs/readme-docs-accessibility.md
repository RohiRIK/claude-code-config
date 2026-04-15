---
feature: readme-docs-accessibility
created: 2026-04-14
---

# Spec: README Accessibility + Docs Surface Improvement

## What

Make `README.md` more useful to new users who clone this repo, and improve the
navigability of the `docs/` folder so every layer/agent/hook/skill is easy to find.

## Why

The README is currently written from the author's perspective — it documents what
was built, not how a new user should get started. The docs folder has rich content
but no index or entry point, making it hard to discover.

---

## Constraints

- **doc-blocker hook**: `Write` is blocked for `.md` files unless the path matches
  `README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, or `context-*.md`.
- New files in `docs/` MUST be named `README.md` (e.g. `docs/README.md`,
  `docs/agents/README.md`). All other new `.md` files must use the `Edit` tool on
  existing files.
- ASCII diagrams preferred over screenshots (existing convention, LTM id:47).

---

## Acceptance Criteria

### 1. README — New-user orientation

- [ ] README opens with a one-sentence "what this is for" line visible before the
  philosophy section — someone who just landed on the repo knows in 5 seconds
  whether it's for them.
- [ ] Quick Start is the **second** visible section (move above Philosophy or
  add a visible "jump to" anchor), so a new user can act immediately.
- [ ] The Docs table is expanded to surface `docs/agents/`, `docs/hooks/`,
  `docs/skills/` — not just the top-level workflow/memory docs.
- [ ] Layer numbers in README are consistent with the updated 4-layer architecture
  (no lingering "3-layer" references).

### 2. docs/README.md — Entry point for the docs folder

- [ ] `docs/README.md` exists and serves as a single-page index of everything in
  `docs/`: top-level files + all subdirs with a one-line description per file.
- [ ] Organized by layer:
  - **Layer 1** — Daily workflow (Boris Cherny: plan → implement → simplify → verify → commit) → `workflow-daily.md`
  - **Layer 2** — Dev workflow (`/spec /plan /build /dev /test`) → `workflow-dev.md`
  - **Layer 3** — Short-term memory (context-mode) → `memory-short-term.md`
  - **Layer 4** — Long-term memory (LTM/SQLite) → `memory-long-term.md`
  - Then: Agents, Hooks, Skills, Auditor subdirs

### 3. Subdir indexes — agents / hooks / skills

- [ ] `docs/agents/README.md` exists: table of all agents with a one-line purpose
  each, linking to their individual `.md` files.
- [ ] `docs/hooks/README.md` exists: table of all hooks (SessionStart, PreCompact,
  etc.) with trigger event and purpose, linking to individual files.
- [ ] `docs/skills/README.md` exists: table of all skills with when-to-invoke,
  linking to individual files.

### 4. Existing docs — consistency pass

- [ ] `docs/workflow-daily.md` header remains "Layer 1" (Boris Cherny daily workflow) — this is correct.
- [ ] `docs/workflow-dev.md` header updated to "Layer 2" (dev workflow) if not already.
- [ ] `docs/memory-short-term.md` header updated to "Layer 3" if not already.
- [ ] `docs/memory-long-term.md` header updated to "Layer 4" if not already.
- [ ] No doc references the old "3-layer" framing.

---

## Out of Scope

- Rewriting individual agent/hook/skill docs (content quality pass is a separate
  task).
- Adding new docs for undocumented hooks or skills.
- Any changes to `CLAUDE.md` or `rules/`.

---

## Files Touched

| File | Change |
|------|--------|
| `README.md` | Orientation line, section order, expanded Docs table |
| `docs/README.md` | **New** — full index of docs folder |
| `docs/agents/README.md` | **New** — agents index table |
| `docs/hooks/README.md` | **New** — hooks index table |
| `docs/skills/README.md` | **New** — skills index table |
| `docs/workflow-daily.md` | Layer number header consistency fix |
