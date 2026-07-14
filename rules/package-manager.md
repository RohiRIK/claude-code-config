# Package Manager Preference

## JavaScript: Always Prefer Bun

ALWAYS use `bun` instead of `npm`, `npx`, `yarn`, or `pnpm`:

| Instead of | Use |
|------------|-----|
| `npm install` | `bun install` |
| `npm run <script>` | `bun run <script>` |
| `npx <package>` | `bunx <package>` (no `-y` flag needed) |
| `npm install -g <pkg>` | `bun add -g <pkg>` |
| `npm add <pkg>` | `bun add <pkg>` |
| `npm add -D <pkg>` | `bun add -d <pkg>` |

## Python: Always Prefer uv

ALWAYS use `uv` instead of `pip`, `pipx`, `pip3`, `python -m pip`, or `poetry`:

| Instead of | Use |
|------------|-----|
| `pip install <pkg>` | `uv pip install <pkg>` |
| `pip install -r requirements.txt` | `uv pip install -r requirements.txt` |
| `pipx install <pkg>` | `uv tool install <pkg>` |
| `pipx run <pkg>` | `uvx <pkg>` |
| `python -m venv .venv` | `uv venv` |
| `pip freeze` | `uv pip freeze` |
| `poetry install` | `uv sync` |
| `poetry add <pkg>` | `uv add <pkg>` |

## JSON Reading

NEVER use `python3 -c "import json..."` for JSON parsing — ~100ms startup penalty per invocation.

| Context | Use |
|---------|-----|
| Shell / pipes | `jq` |
| TS / Bun | `await Bun.file("f.json").json()` |

## MCP Servers

Configure MCP servers with `bunx` (JS) or `uvx` (Python) as the `command` — not `npx` or `pipx`.
