# Pi — Reference

Flags, modes, install, and troubleshooting for the `pi` CLI (pi.dev,
earendil-works). Verify with `pi --version` — flags drift between releases.
Docs: https://pi.dev · usage: https://github.com/earendil-works/pi

## Install & Auth

```bash
bun add -g @earendil-works/pi        # verify exact package name at pi.dev — already installed here
pi --version
```

Auth is via provider API keys in the environment — no separate login subcommand:

```bash
export ANTHROPIC_API_KEY=sk-ant-...  # or OPENAI_API_KEY / GEMINI_API_KEY / etc.
```

Inside the TUI you can also run `/login` and pick a provider. Pi supports
anthropic, openai, google, and others. Confirm a key is set before delegating.

## Execution Modes

| Mode | Invoke | Use |
|------|--------|-----|
| Print (headless) | `pi -p '<prompt>'` | One-shot: runs tools, prints final answer, exits. **Default for delegation.** |
| JSON | `pi --mode json` | Programmatic event stream for parsing |
| RPC | `pi --mode rpc` | Long-lived headless server over stdin/stdout (IDE/app embedding) |
| Interactive | `pi` | TUI — **never** from this session; it hangs |

**Trust in non-interactive modes:** `-p`, `--mode json`, and `--mode rpc` show no
trust prompt. Without a saved trust decision they **ignore project-local inputs**
(e.g. repo `AGENTS.md`, local config) unless you pass `-a`/`--approve`.

## Flags

| Flag | Use |
|------|-----|
| `-p`, `--print` | Print mode — headless one-shot |
| `--mode <json\|rpc>` | Switch to JSON or RPC headless mode |
| `--provider <name>` | `anthropic`, `openai`, `google`, etc. |
| `--model <pattern>` | Model pattern or ID; supports `provider/id` and optional `:<thinking>` |
| `--api-key <key>` | API key (overrides env vars) |
| `--thinking <level>` | `off`, `minimal`, `low`, `medium`, `high`, `xhigh` |
| `--list-models [search]` | List available models |
| `--system-prompt <text>` | Replace default prompt (context files + skills still appended) |
| `--append-system-prompt <text>` | Append to system prompt |
| `-a`, `--approve` | Trust project-local files for this run |
| `-na`, `--no-approve` | Ignore project-local files for this run |
| `-c` | Continue most recent session |
| `-r` | Browse / select a past session |
| `--no-session` | Ephemeral — do not save the session |
| `--name <text>` | Set session display name |
| `--session <path\|id>` | Use a specific session file or ID |
| `--fork <path\|id>` | Fork a session into a new file (parallel exploration) |
| `--verbose` | Force verbose startup |
| `-v`, `--version` / `-h`, `--help` | Version / help |

**No working-directory flag.** Pi operates on the current directory — run it from
the target dir: `cd <path> && timeout … pi -p '…'`.

## Timeouts (mandatory)

Every `pi -p` run is wrapped in `timeout` so a stalled run self-kills instead of
hanging the session silently:

```bash
timeout 200 pi -p '<prompt>'      # bounded one-shot
timeout 900 pi -p '<prompt>'      # large / multi-file task
```

A stuck run exits 124 (timeout) or 143/144 (killed). If you hit the cap, report it
and decide whether to raise the limit or switch to a faster model — do not silently
re-run with no ceiling. For long tasks, prefer `run_in_background: true` +
`BashOutput` polling over a large foreground timeout.

## Permissions (security-sensitive)

In print/JSON/RPC modes pi will **not** prompt for trust, but it can still write
files and run shell commands the prompt asks for.

- Run write-capable tasks against a git repo with a clean-enough tree so pi's edits
  are reviewable in `git diff`.
- Pass `-a`/`--approve` only when you intend pi to read and act on project-local
  config; omit it (or use `-na`) for untrusted repos.

## Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Command hangs, no output | Bare TUI launched — always pass `-p`. |
| "no provider" / auth error | Set a provider API key env var; check with `pi --list-models`. |
| Ignores repo config / AGENTS.md | Non-interactive modes need `-a`/`--approve` to trust project-local files. |
| Output floods context | Background the run; poll `BashOutput`; or redirect to a log file and tail it. |
