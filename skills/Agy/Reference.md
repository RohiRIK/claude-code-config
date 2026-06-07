# Agy — Reference

Flags, models, install, auth, and image setup for the Antigravity CLI (`agy`).
Grounded against agy **1.0.5**. Verify with `agy --version` — flags drift between
releases (notably `--output-format` is absent on some builds). The binary is named
`agy`, not `antigravity`. Official docs (SPA, JS-rendered): https://antigravity.google/docs

## Install & Auth

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash   # macOS / Linux
agy --version                                                  # installs to ~/.local/bin/agy
```

First run launches a Google Sign-In OAuth flow (credentials cached in the system
keyring). Over SSH/headless it prints an auth URL + one-time code. For CI/scripting,
use an API key instead:

```bash
export ANTIGRAVITY_API_KEY=your_api_key_here
```

## Flags (agy 1.0.5)

| Flag | Use |
|------|-----|
| `-p`, `--print`, `--prompt` | Run a single prompt non-interactively and print — **default for delegation** |
| `--print-timeout <dur>` | Cap for print-mode wait (default `5m0s`) |
| `-m <model>` | Select model (see Models below) |
| `--add-dir <path>` | Add a directory to the workspace (repeatable) — the working-dir mechanism |
| `-c`, `--continue` | Continue the most recent conversation |
| `--conversation <id>` | Resume a conversation by ID |
| `-i`, `--prompt-interactive` | Run an initial prompt, then stay interactive (**not** for this session) |
| `--dangerously-skip-permissions` | Auto-approve all tool permission requests (see Permissions) |
| `--sandbox` | Run with terminal restrictions enabled |
| `--log-file <path>` | Override CLI log file path |
| `--output-format json` | Structured output — **verify support** on your build first |

**Subcommands:** `agy inspect` (show loaded config/skills/plugins/MCP — first
debugging step), `agy changelog`, `agy plugin import gemini` (import Gemini CLI
extensions, incl. Nano Banana).

## Models

Default is Gemini via your Google account. Pin a model with `-m`, or configure one
in `~/.config/antigravity/config.toml`:

```toml
model   = "gemini-3.1-pro"     # or claude-opus, gpt-oss-120b, a custom id
base_url = "..."               # for proxies / self-hosted
name    = "My Model"
env_key = "MY_API_KEY"
```

```bash
agy -m gemini-3.1-pro -p '<prompt>'
```

## Image Generation (Nano Banana)

Agy's image feature runs through **Nano Banana** (Gemini image models), exposed as
the `nanobanana` Gemini CLI extension / an Antigravity skill. Setup:

```bash
# Install the extension in Gemini CLI, then import into Antigravity:
gemini extensions install https://github.com/gemini-cli-extensions/nanobanana
agy plugin import gemini
```

Set a Gemini API key in the environment for image calls: export
`NANOBANANA_API_KEY` (or `GEMINI_API_KEY`) — read from a gitignored `.env`, never
hardcode it.

Models:
- Default: `gemini-3.1-flash-image-preview` (Nano Banana 2)
- Pro (higher fidelity): `export NANOBANANA_MODEL=gemini-3-pro-image-preview`

The image command inside an interactive Gemini/Antigravity session is `/generate
"<prompt>"` (also `/edit`, `/compose` for editing existing images). Headlessly, the
agent invokes the tool from a natural-language print-mode prompt — see
`Workflows/GenerateImage.md`. **Verify the headless path once interactively** before
trusting it in a background run: confirm `agy inspect` lists the nano-banana
skill/plugin and that a test `/generate` writes a file.

## Timeouts

Print mode self-limits via `--print-timeout` (default 5m). Wrap every run in an
outer `timeout` as a hard backstop so a wedged process can't hang the session:

```bash
timeout 360 agy -p '<prompt>' --add-dir <path>     # bounded (outer > --print-timeout)
timeout 900 agy -p '<prompt>' --add-dir <path> --print-timeout 14m   # large task
```

A stuck run exits 124 (outer timeout) or 143/144 (killed). For long tasks, prefer
`run_in_background: true` + `BashOutput` polling.

## Permissions (security-sensitive)

`agy` prompts before file writes / shell commands. In a backgrounded run that pause
hangs silently.

- Preferred: keep prompts and watch with `BashOutput`, or use `--sandbox` for
  terminal-restricted runs.
- `--dangerously-skip-permissions` auto-approves everything. **Use only** in a
  throwaway clone, a git worktree, or a sandbox you can discard — never against a
  repo with uncommitted work you care about. State that you are using it and why
  before the run.

## Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Command hangs, no output | Bare TUI / `-i` launched — always use `-p`. Or a permission prompt — check `BashOutput`. |
| `flags provided but not defined: -output-format` | That build lacks `--output-format`; drop it or update agy. |
| Auth / sign-in loop | Re-run to trigger OAuth, or set `ANTIGRAVITY_API_KEY`. Over SSH use the printed URL+code. |
| Image gen does nothing | nano-banana not imported — run `agy inspect`; re-do `gemini extensions install` + `agy plugin import gemini`; set `NANOBANANA_API_KEY`. |
| Wrong context loaded | `agy inspect` shows exactly which config/skills/plugins/MCP are active. |
