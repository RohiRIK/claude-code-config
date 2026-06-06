# OpenCode — Reference

Flags, models, install, and troubleshooting for the `opencode` CLI.
Grounded against opencode **1.15.13**. Verify with `opencode --version` —
flags drift between releases.

## Install & Auth

```bash
bun add -g opencode-ai@latest        # or: brew install anomalyco/tap/opencode
opencode auth login                  # interactive provider setup (alias: opencode providers)
opencode auth list                   # must show ≥1 provider before delegating
```

If auth is missing, provider env vars also work (e.g. `OPENROUTER_API_KEY`,
`ANTHROPIC_API_KEY`). Confirm with `opencode auth list`.

## Binary Resolution

Multiple installs can shadow each other. If behavior differs from your terminal:

```bash
which -a opencode      # list all on PATH
opencode --version
```

Pin an explicit path when needed:

```bash
"$HOME/.bun/bin/opencode" run '…'    # or /opt/homebrew/bin/opencode
```

## `opencode run` — Non-Interactive Flags

`opencode run '<message>'` executes the task and exits. Core flags:

| Flag | Use |
|------|-----|
| `--dir <path>` | Run in this directory (prefer over `cd`) |
| `--format json` | Raw JSON event stream — use only when parsing programmatically |
| `-f, --file <path>` | Attach file(s) as context (repeatable / array) |
| `-m, --model provider/model` | Force a model, e.g. `anthropic/claude-sonnet-4-6` |
| `--agent <name>` | OpenCode agent: `build` (writes code) or `plan` (read-only planning) |
| `--variant <level>` | Reasoning effort: `high`, `max`, `minimal` |
| `--thinking` | Surface model thinking blocks |
| `-c, --continue` | Continue the last session |
| `-s, --session <id>` | Continue a specific session |
| `--fork` | Branch a session (with `--continue`/`--session`) for parallel exploration |
| `--share` | Produce a shareable session link |
| `--title <name>` | Name the session |
| `--attach <url>` | Connect to a running `opencode serve` instance |

List available models per provider: `opencode models [provider]`.

## Permissions (security-sensitive)

`opencode run` may pause for permission prompts on file writes or shell commands.
In a backgrounded run that pause hangs silently.

- Preferred: keep prompts and watch with `BashOutput`; respond by continuing the
  session, or pre-configure trusted permissions in opencode's own config.
- `--dangerously-skip-permissions` auto-approves everything not explicitly denied.
  **Use only** in a throwaway clone, a git worktree, or a sandbox you can discard —
  never against a repo with uncommitted work you care about. State that you are
  using it and why before the run.

## Other Subcommands

| Command | Purpose |
|---------|---------|
| `opencode pr <number>` | Fetch + checkout a GitHub PR branch, then run opencode (see `Workflows/ReviewPR.md`) |
| `opencode serve` | Headless server (attach long-lived runs with `--attach`) |
| `opencode models [provider]` | List available models |
| `opencode stats` | Token usage and cost |
| `opencode export [sessionID]` | Export session as JSON |
| `opencode session` | Manage sessions |

## Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Command hangs, no output | Bare TUI launched — always use `run`. Or a permission prompt — check `BashOutput`. |
| "no provider" / auth error | `opencode auth list`; re-run `opencode auth login` or set provider env var. |
| Wrong binary behavior | `which -a opencode`; pin the full path. |
| Output floods context | Background the run; poll `BashOutput`; or redirect to a log file and tail it. |
