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
║      │         [PostToolUse] Prettier + tsc on every edit            ║
║      │         [PostToolUse] warns on console.log                    ║
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
- **Prettier** auto-formats JS/TS
- **tsc check** runs `tsc --noEmit` after every `.ts` edit
- **console.log guard** warns if debug logging sneaks in

### `/simplify` — Remove Complexity
After implementation, run `/simplify`. It reviews the changed code for unnecessary abstraction, deep nesting, and premature generalization, then fixes what it finds.

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
| `/tdd` | New features — writes tests FIRST |
| `/code-review` | After writing code |
| `/e2e` | Critical user flows — Playwright tests |
| `/build-fix` | When build fails |
| `/refactor-clean` | Remove dead code |
| `/goose` | Spawn parallel autonomous agents |
| `/learn` | End of session — extract reusable patterns |
| `/init-context` | New project — creates 4 context files |
| `/check-context` | Start of session — verify context |
| `/update-context` | End of session — auto-extract progress |
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
| `SessionStart` | Session open | Injects saved project context (60 lines) |
| `SessionAutoName` | First prompt | Sets Ghostty tab title |
| `SuggestCompact` | Every edit | Suggests /compact at 50 tool calls |
| `SkillGuard` | Skill invocation | Blocks false-positive triggers |
| `Prettier` | After JS/TS edit | Auto-formats code |
| `tsc check` | After .ts edit | Runs tsc --noEmit |
| `console.log guard` | After any edit | Warns about debug logging |
| `tmux reminder` | `bun run dev` | Blocks — must use tmux for dev servers |
| `PreToolUse` | Before git push | Opens Zed for review |
