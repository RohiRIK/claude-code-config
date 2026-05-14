# Token Budget

How many tokens load at session start, what loads on-demand, and where the biggest costs are.
Use this as the baseline for optimization decisions.

---

## Session Start (Always Loaded)

These load on every session, before any user message:

| Source | Size | ~Tokens | Notes |
|--------|------|---------|-------|
| `CLAUDE.md` | 4.0 KB | 1,016 | Global config |
| `rules/*.md` (13 files) | 25.0 KB | 6,399 | All rules auto-inject |
| `hooks/CLAUDE.md` | 2.6 KB | 669 | Bun rules (TS/JS globs) |
| LTM SessionStart | ~10 KB | ~2,500 | 27 globals + 16 ctx items |
| Claude Code system prompt | ~12 KB | ~3,000 | Built-in, not configurable |
| git status + available skills list | ~5 KB | ~1,250 | Injected by harness |
| **Total** | **~58 KB** | **~14,834** | |

### Rules breakdown (largest first)

| File | Size | ~Tokens |
|------|------|---------|
| `pre-commit-sanitize.md` | 3.8 KB | 946 |
| `session-context.md` | 3.6 KB | 897 |
| `workflow-guide.md` | 2.6 KB | 650 |
| `workflow.md` | 2.5 KB | 632 |
| `agents.md` | 2.4 KB | 610 |
| `package-manager.md` | 2.3 KB | 585 |
| `coding-style.md` | 2.2 KB | 561 |
| `git-workflow.md` | 1.3 KB | 314 |
| `security.md` | 1.1 KB | 276 |
| `testing.md` | 1.1 KB | 274 |
| `patterns.md` | 1.0 KB | 267 |
| `learned-summary.md` | 0.8 KB | 197 | Points to empty patterns dir |
| `audit-ingestion.md` | 0.8 KB | 190 |

---

## On-Demand (Load When Triggered)

These only hit the context window when explicitly invoked:

### Commands (`/command`) — loads once per invocation

| File | Size | ~Tokens | Trigger |
|------|------|---------|---------|
| `e2e.md` | 10.5 KB | 2,687 | `/e2e` |
| `tdd.md` | 8.0 KB | 2,037 | `/tdd` |
| `plan.md` | 3.8 KB | 980 | `/plan` |
| `verify.md` | 2.0 KB | 502 | `/verify` |
| `commit-push-pr.md` | 1.2 KB | 312 | `/commit-push-pr` |
| `code-review.md` | 1.0 KB | 268 | `/code-review` |
| `spec.md` | 0.9 KB | 236 | `/spec` |
| others (6 files) | 4.3 KB | 1,087 | various |
| **Total** | **31.5 KB** | **8,071** | |

### Agents — loads on spawn, stays for agent lifetime

| File | Size | ~Tokens | Spawned by |
|------|------|---------|------------|
| `e2e-runner.md` | 19.4 KB | 4,961 | `/e2e` |
| `security-reviewer.md` | 14.0 KB | 3,585 | `/verify`, security checks |
| `build-error-resolver.md` | 12.0 KB | 3,060 | build failures |
| `doc-updater.md` | 10.7 KB | 2,747 | `/update-docs` |
| `refactor-cleaner.md` | 7.5 KB | 1,928 | `/simplify` (repo-wide) |
| `tdd-guide.md` | 6.9 KB | 1,775 | `/tdd`, `/test` |
| `architect.md` | 6.2 KB | 1,581 | complex features |
| `planner.md` | 4.9 KB | 1,255 | `/plan` |
| `code-simplifier.md` | 4.9 KB | 1,252 | `/simplify` |
| others (4 files) | 14.0 KB | 3,469 | various |
| **Total** | **100 KB** | **25,613** | |

### Skills — SKILL.md loads on invoke, Workflows load per step

| File | Size | ~Tokens | Notes |
|------|------|---------|-------|
| `AgentBrowser/SKILL.md` | 10.8 KB | 2,771 | Largest SKILL.md |
| `DockerPatterns/SKILL.md` | 8.0 KB | 2,045 | |
| `Prompting/SKILL.md` | 7.3 KB | 1,870 | |
| `Art/SKILL.md` | 5.7 KB | 1,458 | |
| others (13 SKILL.md) | 17.0 KB | 4,250 | |
| **SKILL.md total** | **48 KB** | **12,206** | |

### Skill Workflows — largest files (load per workflow step)

| File | Size | ~Tokens |
|------|------|---------|
| `Prompting/Standards.md` | 36.2 KB | 9,274 |
| `Art/Workflows/Essay.md` | 35.4 KB | 9,068 |
| `Art/Workflows/Mermaid.md` | 30.0 KB | 7,672 |
| `Art/Workflows/Visualize.md` | 29.2 KB | 7,466 |
| `FrontendDesign/Patterns.md` | 14.0 KB | 3,578 |
| `Art/Workflows/Comics.md` | 13.8 KB | 3,533 |
| `Art/Workflows/Maps.md` | 13.2 KB | 3,386 |
| `BackendDesign/Patterns.md` | 12.9 KB | 3,294 |
| others (69 files) | ~318 KB | ~81,628 |
| **Workflows total** | **500 KB** | **128,099** |

---

## Full Picture

| Layer | Size | ~Tokens | When |
|-------|------|---------|------|
| Session start (fixed overhead) | 58 KB | 14,834 | Every session |
| Commands (if used) | 32 KB | 8,071 | Per `/command` |
| Agents (if spawned) | 100 KB | 25,613 | Per agent |
| Skills SKILL.md (if invoked) | 48 KB | 12,206 | Per skill |
| Skills Workflows (if run) | 500 KB | 128,099 | Per workflow step |
| **Max possible in one session** | **~738 KB** | **~188,823** | |

A heavy session (plan → dev → simplify → verify) touches ~100–150K tokens of on-demand content on top of the 15K baseline.

---

## Optimization Targets

Ranked by impact:

1. **`Art/Workflows/`** — 130KB+ across 15 files. These only load when you run art-related skills. Low priority if you use art tools regularly; high priority if you rarely do.
2. **`agents/e2e-runner.md`** (19.4 KB) + **`security-reviewer.md`** (14 KB) — bloated with example code. Could be trimmed significantly.
3. **`rules/pre-commit-sanitize.md`** (3.8 KB) + **`rules/session-context.md`** (3.6 KB) — both load every session. Session-context in particular repeats content already managed by LTM hooks.
4. **`rules/learned-summary.md`** (0.8 KB) — points to `skills/Learned/patterns/` which no longer exists (deleted). Dead rule eating tokens every session.
5. **`Prompting/Standards.md`** (36 KB) — only loads during `/spec` or prompting work, but it's the single largest workflow file.

---

*Last measured: 2026-05-14. Re-run `ctx_batch_execute` with the measurement commands to refresh.*
