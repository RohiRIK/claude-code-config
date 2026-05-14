# Layer 1: Daily Workflow

The Boris Cherny pattern — creator of Claude Code's recommended task loop.

---

## Flow

```
╔══════════════════════════════════════════════════════════════════════╗
║  LAYER 1 · DAILY WORKFLOW  (Boris Cherny pattern)                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║    /plan ────→ Plan Mode (Shift+Tab×2)                               ║
║      │         Refine until solid → confirm "yes"                    ║
║      ↓                                                               ║
║    IMPLEMENT → auto-accept mode                                      ║
║      │         [PostToolUse] Biome + tsc on every edit              ║
║      │         [PostToolUse] warns on console.log                    ║
║      ↓                                                               ║
║    /capture  → save context + learn in one shot                      ║
║      ↓                                                               ║
║    /update-context → log progress/decisions/gotchas to LTM           ║
║      ↓                                                               ║
║    /simplify → remove complexity, flatten nesting                    ║
║      ↓                                                               ║
║    /verify ──→ tsc → lint → tests → build → security → diff          ║
║      ↓                                                               ║
║    /commit-push-pr → conventional commit → push → PR                 ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

> Bad plan → constant steering. Good plan → 1-shot implementation.

---

## Step by Step

### `/plan` — Plan First
Enter Plan Mode (Shift+Tab×2). Describe the task clearly. Refine the plan until solid, then confirm. Claude will not touch code until you say "yes".

### `IMPLEMENT` — Auto-Accept Mode
Switch to auto-accept (Shift+Tab×1 or the accept-all toggle). Hooks fire on every edit:
- **Biome** auto-formats JS/TS (`bunx biome check --write`)
- **tsc check** runs `tsc --noEmit` after every `.ts` edit
- **console.log guard** warns if debug logging sneaks in

### `/capture` — Save Context + Learn in One Shot
After implementation, run `/capture` to snapshot what just happened — saves context and fires `/learn` in a single step. Use this instead of running `/update-context` and `/learn` separately when you want to lock in both progress and any patterns discovered.

### `/update-context` — Log to LTM
After implementation, capture what was done. Run `/update-context progress "✓ did X"` or `/update-context decision "chose Y because Z"`. These persist to the LTM MCP server (see [`RohiRIK/claude-ltm-plugin`](https://github.com/RohiRIK/claude-ltm-plugin)) and survive compaction. The `EvaluateSession` hook does this automatically at session end — run it mid-session for important milestones.

### `/simplify` — Remove Complexity
After implementation, run `/simplify`. It invokes the `code-simplifier` agent to review changed code for unnecessary abstraction, deep nesting, and premature generalization, then fixes what it finds.

### `/verify` — Gate Before Commit
Runs: tsc → lint → tests → build → security check → git diff review. If anything fails, fix it here.

### `/commit-push-pr` — Ship It
Pre-computes the full git context (log, diff, branch), writes a conventional commit message, pushes, and opens a PR with a summary and test plan.

---

## All Commands

| Command | When to Use |
|---------|------------|
| `/plan` | **Always first** — before any non-trivial change |
| `/simplify` | After implementation — remove complexity |
| `/verify` | Before committing — tsc + tests + security + diff |
| `/commit-push-pr` | Final step — precomputes git context |
| `/capture` | After implementation — save context + learn in one shot |
| `/tdd` | New features — writes tests FIRST |
| `/code-review` | After writing code |
| `/e2e` | Critical user flows — Playwright tests |
| `/build-fix` | When build fails |
| `/refactor-clean` | Remove dead code |
| `/learn` | End of session — extract reusable patterns |
| `/init-context` | New project — creates 4 context files |
| `/check-context` | Start of session — verify context |
| `/update-context` | Mid-session — log progress/decisions/gotchas to LTM |
| `/register-project` | Register or rename project in registry |

---

## Agents (auto-invoked when relevant)

Located in `~/.claude/agents/`.

| Agent | Trigger |
|-------|---------|
| `planner` | Complex features, architectural changes |
| `architect` | System design decisions |
| `tdd-guide` | New features, bug fixes — enforces tests-first |
| `code-reviewer` | After writing/modifying code |
| `code-simplifier` | `/simplify` — remove complexity, flatten nesting |
| `security-reviewer` | Auth, API endpoints, user input |
| `database-reviewer` | SQL, migrations, schema design, Supabase RLS |
| `python-reviewer` | Any Python code changes |
| `build-error-resolver` | Build or TypeScript errors |
| `e2e-runner` | Playwright E2E tests |
| `refactor-cleaner` | Dead code, duplicates |
| `doc-updater` | Documentation updates |

---

## Hooks (fire during this loop)

| Hook | Trigger | What It Does |
|------|---------|-------------|
| `SessionStart` | Session open | Injects LTM context + uncommitted file summary |
| `SessionAutoName` | First prompt | Sets Ghostty tab title |
| `PrePlan` | `/plan` prompt | Injects Pre-Plan Context briefing (Lean Observe) |
| `SuggestCompact` | Every edit | Suggests /compact at 50 tool calls |
| `SkillGuard` | Skill invocation | Blocks false-positive triggers |
| `Biome` | After JS/TS edit | Auto-formats code (`bunx biome check --write`) |
| `tsc check` | After .ts edit | Runs tsc --noEmit |
| `console.log guard` | After any edit | Warns about debug logging |
| `tmux reminder` | `bun run dev` | Blocks — must use tmux for dev servers |
