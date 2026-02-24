# ~/.claude — Claude Code Global Config

> Personal Claude Code setup. Applies to all projects.
> Last updated: 2026-02-24

---

## The Workflow

Every task follows this loop, inspired by Boris Cherny (creator of Claude Code):

```
┌─────────────────────────────────────────────────────────────┐
│                    FULL TASK WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PLAN          /plan <idea>                              │
│     ↓             Shift+Tab twice → Plan Mode               │
│     ↓             Refine until plan is solid                │
│     ↓             Confirm with "yes"                        │
│                                                             │
│  2. IMPLEMENT     Switch to auto-accept mode                │
│     ↓             Claude codes the plan                     │
│     ↓             Steer only when needed                    │
│                                                             │
│  3. SIMPLIFY      /simplify                                 │
│     ↓             Remove complexity, flatten nesting        │
│     ↓             Functions < 50 lines, no dead code        │
│                                                             │
│  4. VERIFY        /verify                                   │
│     ↓             tsc → lint → tests → build                │
│     ↓             security scan → diff review               │
│     ↓             Fix failures before proceeding            │
│                                                             │
│  5. COMMIT        /commit-push-pr                           │
│                   Git context precomputed                   │
│                   Conventional commit → push → PR           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Principle

> "A good plan is really important. Claude typically 1-shots implementation from a well-formed plan."
> — Boris Cherny

Bad plan → constant steering corrections.
Good plan → 1-shot implementation.

---

## All Commands

| Command | When to Use |
|---------|------------|
| `/plan` | **Always first** — before any non-trivial change |
| `/simplify` | After implementation — remove complexity |
| `/verify` | Before committing — tsc + tests + security + diff |
| `/commit-push-pr` | Final step — precomputes git context |
| `/tdd` | New features — writes tests FIRST |
| `/code-review` | After writing code |
| `/init-context` | New project — creates 4 context files |
| `/learn` | End of session — extract reusable patterns |
| `/e2e` | Critical user flows — Playwright tests |
| `/build-fix` | When build fails |
| `/refactor-clean` | Remove dead code |
| `/goose` | Spawn parallel autonomous agents |

---

## Agents

Auto-invoked by Claude when relevant. Located in `~/.claude/agents/`.

| Agent | Trigger |
|-------|---------|
| `planner` | Complex features, architectural changes |
| `architect` | System design decisions |
| `tdd-guide` | New features, bug fixes — enforces tests-first |
| `code-reviewer` | After writing/modifying code |
| `security-reviewer` | Auth, API endpoints, user input |
| `database-reviewer` | SQL, migrations, schema design, Supabase RLS |
| `python-reviewer` | Any Python code changes |
| `build-error-resolver` | Build or TypeScript errors |
| `e2e-runner` | Playwright E2E tests |
| `refactor-cleaner` | Dead code, duplicates |
| `doc-updater` | Documentation updates |

---

## Hooks (Auto-firing)

| Hook | Trigger | What It Does |
|------|---------|-------------|
| `SessionStart` | Session open | Injects saved project context (60 lines) |
| `SessionAutoName` | First prompt | Sets Ghostty tab title (e.g. "Hook Permissions") |
| `PreCompact` | Before compaction | Saves 4 context files → context-summary.md |
| `EvaluateSession` | Session end | Extracts patterns to skills/Learned/ |
| `UpdateContext` | Session end | Appends progress to context-progress.md |
| `Cleanup` | Session end | Trims context-progress.md to last 20 items |
| `SuggestCompact` | Every edit | Suggests /compact at 50 tool calls |
| `SkillGuard` | Skill invocation | Blocks false-positive keybindings-help triggers |
| `Prettier` | After JS/TS edit | Auto-formats code |
| `tsc check` | After .ts edit | Runs tsc --noEmit |
| `console.log` | After any edit | Warns about debug logging |
| `tmux reminder` | bun run dev | Blocks — must use tmux for dev servers |

---

## Session Context System

Per-project memory. Survives /compact and session restarts.

**Files** at `~/.claude/projects/<slug>/`:

| File | Contains |
|------|---------|
| `context-goals.md` | Current goal (max 5 lines) |
| `context-decisions.md` | Architectural decisions (permanent) |
| `context-progress.md` | ✓ done items + → in progress |
| `context-gotchas.md` | Warnings and blockers (permanent) |
| `context-summary.md` | Auto-assembled by PreCompact, injected by SessionStart |

**How it works:**
```
Work → /compact fires → PreCompact assembles context-summary.md
New session → SessionStart injects context-summary.md → "Restored Project Context"
```

**Setup for a new project:** `/init-context`

---

## Skills

Located in `~/.claude/skills/`. Invoked via Skill tool when relevant.

| Skill | Purpose |
|-------|---------|
| `Learned` | Auto-saves patterns from each session |
| `ContinuousLearning` | Orchestrates learning system |
| `StrategicCompact` | Guides when/how to compact |
| `TddWorkflow` | TDD orchestration |
| `SecurityReview` | Security audit checklists |
| `Prompting` | Prompt engineering templates |
| `Goose` | Parallel agent orchestration |
| `agent-browser` | Browser automation |
| `Art` | Diagrams, visuals, mermaid |
| `BackendDesign` | API design, DB patterns |
| `FrontendDesign` | React/Next.js patterns |
| `docker-patterns` | Docker + Compose patterns |
| `CreateSkill` | Create new skills |

---

## Directory Structure

```
~/.claude/
├── README.md                    ← this file
├── CLAUDE.md                    ← token-efficient global context
├── settings.json                ← hooks, permissions
├── agents/                      ← 11 specialized agents
├── commands/                    ← slash commands (/plan, /verify, etc.)
├── hooks/                       ← auto-firing TypeScript hooks
│   ├── SessionStart/
│   ├── SessionAutoName/
│   ├── PreCompact/
│   ├── EvaluateSession/
│   ├── UpdateContext/
│   ├── Cleanup/
│   ├── SuggestCompact/
│   └── SkillGuard/
├── rules/                       ← always-loaded policies
│   ├── coding-style.md
│   ├── git-workflow.md
│   ├── testing.md
│   ├── security.md
│   ├── agents.md
│   ├── package-manager.md
│   ├── patterns.md
│   ├── session-context.md
│   └── learned-summary.md
├── skills/                      ← 13 skills
└── projects/                    ← per-project context files
    └── <slug>/
        ├── context-goals.md
        ├── context-decisions.md
        ├── context-progress.md
        ├── context-gotchas.md
        └── context-summary.md
```

---

## Non-Negotiables

- **bun** not npm/yarn · **uv** not pip
- Immutability: spread operators, never mutate objects
- No hardcoded secrets — env vars only
- 80% test coverage minimum
- Conventional commits: `feat|fix|refactor|docs|chore: description`
- No `console.log` in committed code
- Long-running commands → tmux

---

## Backed-up Skills (not loaded)

Available at `~/claude-archive/` if needed:
- `Audit` — productivity audit workflow
- `CreateCLI` — TypeScript CLI generator
