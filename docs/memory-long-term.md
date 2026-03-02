# Layer 3: Long-Term Memory

Two loops: session context (survives /compact and restarts) and the learning loop (extracts patterns across sessions).

---

## Session Context Loop

```
╔══════════════════════════════════════════════════════════════════════╗
║  SESSION CONTEXT LOOP  (per session / compaction)                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────────┐   ║
║   │  Session open                                                │   ║
║   │    [SessionStart] reads registry.json                        │   ║
║   │    → injects context-summary.md into Claude's context        │   ║
║   │    → "Restored Project Context"                              │   ║
║   │         ↓                                                    │   ║
║   │  Work … write context-progress.md after each task            │   ║
║   │         ↓                                                    │   ║
║   │  /compact fires                                              │   ║
║   │    [PreCompact] reads 4 context files                        │   ║
║   │    → assembles context-summary.md (60 lines max)             │   ║
║   │         ↓                                                    │   ║
║   │  Context window cleared ─────────────────────────────────→   │   ║
║   └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Learning Loop

```
╔══════════════════════════════════════════════════════════════════════╗
║  LEARNING LOOP  (per session end)                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║    Session ends                                                      ║
║      [EvaluateSession] reads transcript                              ║
║        → skills/Learned/patterns/YYYY-MM-DD.md                       ║
║        → skills/Learned/summary.md  (rolling 50-line log)            ║
║        → [UpdateContext] appends to context-progress.md              ║
║        → [Cleanup] trims context-progress.md to last 20 items        ║
║              ↓                                                       ║
║    /learn  → Learned skill retrieves patterns → apply to work        ║
║              ↓                                                       ║
║    rules/learned-summary.md  (always loaded into every session)      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## The 4 Context Files

Located at `~/.claude/projects/<name>/` (friendly name from registry — run `/register-project` to see yours).

| File | Contains | Rules |
|------|----------|-------|
| `context-goals.md` | Current goal | Max 5 lines; rewrite when goal changes |
| `context-decisions.md` | Architectural decisions | Permanent — never delete entries |
| `context-progress.md` | ✓ done / → in progress | Auto-trimmed to last 20 items by Cleanup hook |
| `context-gotchas.md` | Warnings and blockers | Permanent — never delete entries |
| `context-summary.md` | Auto-assembled by PreCompact | Do not edit manually |

**Registry** at `~/.claude/projects/registry.json`: maps absolute paths → friendly names. Supports prefix matching so subdirs inherit parent project context.

---

## Context Commands

| Command | What it does |
|---------|-------------|
| `/init-context` | Create the 4 context files for a new project |
| `/check-context` | Verify Claude has the right context at session start — reads files and cross-checks vs injected context |
| `/update-context` | Auto-extract progress/decisions/gotchas from the current session transcript |
| `/register-project` | Register or rename a project path in `registry.json` |

---

## Hooks (long-term memory layer)

| Hook | Trigger | What It Does |
|------|---------|-------------|
| `SessionStart` | Session open | Reads registry, injects context-summary.md |
| `PreCompact` | Before compaction | Reads 4 files → assembles context-summary.md |
| `EvaluateSession` | Session end | Extracts patterns → skills/Learned/ |
| `UpdateContext` | Session end | Appends progress to context-progress.md |
| `Cleanup` | Session end | Trims context-progress.md to last 20 items |

---

## Skills (learning layer)

Located in `~/.claude/skills/`. Invoked via the Skill tool when relevant.

| Skill | Purpose |
|-------|---------|
| `Learned` | Retrieval system for session patterns. `/learn` extracts lessons; `EvaluateSession` writes daily pattern files |
| `ContinuousLearning` | Orchestrates the learning system |
| `StrategicCompact` | Guides when/how to compact |
| `TddWorkflow` | TDD orchestration |
| `SecurityReview` | Security audit checklists |
| `Prompting` | Prompt engineering templates |
| `Goose` | Parallel agent orchestration |
| `Art` | Diagrams, visuals, mermaid |
| `BackendDesign` | API design, DB patterns |
| `FrontendDesign` | React/Next.js patterns |
| `docker-patterns` | Docker + Compose patterns |
| `CreateSkill` | Create new skills |

---

## Promoting Learned Patterns to Permanent Gotchas

`skills/Learned/` files are ephemeral — the rolling summary trims old sessions.
If `/learn` or `EvaluateSession` surfaces a lesson that should persist permanently:

1. Append to `~/.claude/projects/<name>/context-gotchas.md`:
   `⚠ <lesson learned, 1 line>`
2. Gotchas are **never trimmed** — they survive every compaction

Examples of what to promote:
- A bug pattern that bit you twice
- A library quirk or environment constraint
- A decision reversal and why

---

## Design Decision: Hooks are TypeScript

Inspired by [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), all hooks are written in TypeScript and run via `bun`. This gives:
- Type safety and IDE support
- Shared utility libs (`hooks/lib/hookUtils.ts`, `hooks/lib/resolveProject.ts`)
- Testable, maintainable logic without heredoc nightmares
- Consistent stdin/stdout parsing across all hooks
